var from = require('from2')
var mutexify = require('mutexify')
var varint = require('varint')
var messages = require('./messages')
var codecs = require('codecs')
var inherits = require('inherits')
var events = require('events')
var cache = require('array-lru')
var nextTick = require('process-nextick-args')

module.exports = Tree

function Tree (feed, opts) {
  if (!(this instanceof Tree)) return new Tree(feed, opts)
  if (!opts) opts = {}

  events.EventEmitter.call(this)

  this._offset = opts.offset || 0
  this._codec = opts.codec || codecs(opts.valueEncoding)
  this._head = typeof opts.checkout === 'number' ? opts.checkout : -1
  this._lock = mutexify()
  this._cache = getCache(opts)
  this._wait = opts.wait !== false
  this._cached = !!opts.cached
  this._asNode = !!opts.node
  this._readonly = !!opts.readonly

  this.feed = feed
  this.version = this._head

  var self = this

  this.ready(function (err) {
    if (!err) self.emit('ready')
  })
}

inherits(Tree, events.EventEmitter)

Tree.prototype.put = function (name, value, cb) {
  var self = this
  var names = split(name)

  this._lock(function (release) {
    self.head(function (err, head, seq) {
      if (err) return done(err)
      if (self._readonly) return done(new Error('Cannot delete on a checkout'))
      if (!head) self._init(names, value, done)
      else self._put(head, seq, names, value, done)
    })

    function done (err) {
      release(cb, err)
    }
  })
}

Tree.prototype._put = function (head, seq, names, value, cb) {
  var self = this
  var i = 0
  var end = names.length + 1
  var index = []
  var len = self.feed.length

  loop(null, null, null)

  function loop (err, nodes, seqs) {
    if (err) return cb(err)

    if (nodes) {
      var result = []

      for (var j = 0; j < nodes.length; j++) {
        if (split(nodes[j].name)[i - 1] !== names[i - 1]) {
          result.push(seqs[j])
        }
      }

      result.push(len)
      index.push(result)
    }

    if (i === end) {
      var node = {
        name: join(names),
        value: self._codec.encode(value),
        paths: self._deflate(len, index)
      }

      self.version = self.feed.length
      self.feed.append(messages.Node.encode(node), cb)
      return
    }

    self._list(head, seq, names.slice(0, i++), null, loop)
  }
}

Tree.prototype.list = function (name, opts, cb) {
  if (typeof opts === 'function') return this.list(name, null, opts)
  opts = this._defaultOpts(opts)

  var self = this
  var names = split(name)
  var ns = !!(opts.node || opts.nodes)

  this.head(opts, function (err, head, seq) {
    if (err) return cb(err)
    if (!head) return cb(notFound(names))

    self._list(head, seq, names, opts, onnodes)

    function onnodes (err, nodes, seqs) {
      if (err) return cb(err)
      if (!nodes.length) return cb(notFound(names))

      var list = []
      for (var i = 0; i < nodes.length; i++) {
        var nodeNames = split(nodes[i].name)
        if (nodeNames.length > names.length) {
          list.push(ns ? self._node(nodes[i], seqs[i]) : nodeNames[names.length])
        }
      }

      cb(null, list)
    }
  })
}

Tree.prototype._list = function (head, seq, names, opts, cb) {
  var headIndex = this._inflate(seq, head.paths)
  var cmp = compare(split(head.name), names)

  var index = cmp < headIndex.length && headIndex[cmp]
  var closest = cmp === names.length

  if (!closest) {
    if (!index || !index.length || (index.length === 1 && index[0] === seq)) return cb(null, [], [])
    this._closer(names, cmp, index, opts, cb)
    return
  }

  if (!index || !index.length) return cb(null, [], [])

  this._getAll(index, opts, cb)
}

Tree.prototype.get = function (name, opts, cb) {
  if (typeof opts === 'function') return this.get(name, null, opts)
  opts = this._defaultOpts(opts)

  var names = split(name)
  var self = this

  this.head(opts, function (err, head, seq) {
    if (err) return cb(err)
    if (!head) return cb(notFound(names))
    self._get(head, seq, names, null, opts, cb)
  })
}

Tree.prototype.path = function (name, opts, cb) {
  if (typeof opts === 'function') return this.path(name, null, opts)
  opts = this._defaultOpts(opts)

  var names = split(name)
  var path = []
  var self = this

  this.head(opts, function (err, head, seq) {
    if (err) return cb(err)
    if (!head) return cb(notFound(names))
    self._get(head, seq, names, path, opts, function (err) {
      if (err && !err.notFound) return cb(err)
      cb(null, path)
    })
  })
}

Tree.prototype.checkout = function (seq, opts) {
  opts = this._defaultOpts(opts)

  return new Tree(this.feed, {
    checkout: seq,
    readonly: true,
    offset: this._offset,
    codec: opts.valueEncoding ? codecs(opts.valueEncoding) : this._codec,
    cache: this._cache || opts.cache || false,
    node: opts.node,
    wait: opts.wait,
    cached: opts.cached
  })
}

Tree.prototype._del = function (head, seq, names, cb) {
  var self = this
  var i = 0
  var end = names.length + 1
  var index = []
  var len = self.feed.length
  var ignore = join(names)

  closest(names.length, function (err, c, cseq) {
    if (err) return cb(err)

    var cnames = c ? split(c.name) : []
    var depth = compare(names, cnames) + 1

    loop(null, null, null)

    function loop (err, nodes, seqs) {
      if (err) return cb(err)

      if (nodes && i <= depth) {
        var result = []

        for (var j = 0; j < nodes.length; j++) {
          if (split(nodes[j].name)[i - 1] !== names[i - 1]) {
            if (nodes[j].name !== ignore) {
              result.push(seqs[j])
            }
          }
        }

        if (i < depth) {
          result.push(len)
        }

        index.push(result)
      }

      if (i === end) {
        var node = {
          name: join(names),
          value: null,
          paths: self._deflate(len, index)
        }

        self.version = self.feed.length
        self.feed.append(messages.Node.encode(node), cb)
        return
      }

      self._list(head, seq, names.slice(0, i++), null, loop)
    }
  })

  function closest (j, cb) {
    self._list(head, seq, names.slice(0, j), null, function (err, nodes, seqs) {
      if (err) return cb(err)

      for (var i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].name !== ignore && nodes[i].value) return cb(null, nodes[i], seqs[i])
      }

      if (j <= 0) {
        return cb(null, null, -1)
      }

      closest(j - 1, cb)
    })
  }
}

Tree.prototype.del = function (name, cb) {
  var self = this
  var names = split(name)

  this._lock(function (release) {
    self.head(function (err, head, seq) {
      if (err) return done(err)
      if (self._readonly) return done(new Error('Cannot delete on a checkout'))
      if (!head) return done(null)
      else self._del(head, seq, names, done)
    })

    function done (err) {
      release(cb, err)
    }
  })
}

Tree.prototype._get = function (head, seq, names, record, opts, cb) {
  var self = this
  var headNames = split(head.name)
  var cmp = compare(names, headNames)

  if (record) record.push(seq)

  if (cmp === headNames.length && cmp === names.length) {
    if (opts.node) return cb(null, this._node(head, seq))
    if (!head.value) return cb(notFound(names))
    return cb(null, this._codec.decode(head.value))
  }

  var inflated = this._inflate(seq, head.paths)
  if (cmp >= inflated.length) return cb(notFound(names))

  var index = inflated[cmp]
  var len = index.length
  if (index[len - 1] === seq) len--

  if (!len) return cb(notFound(names))

  var target = cmp < names.length ? names[cmp] : null
  var error = null
  var missing = len

  for (var i = 0; i < len; i++) {
    this._getAndDecode(index[i], opts, onget)
  }

  function onget (err, node, seq) {
    if (err) error = err

    if (node) {
      var nodeNames = split(node.name)
      if ((cmp < nodeNames.length ? nodeNames[cmp] : null) === target) {
        return self._get(node, seq, names, record, opts, cb)
      }
    }

    if (!--missing) cb(error || notFound(names))
  }
}

Tree.prototype._closer = function (names, cmp, index, opts, cb) {
  var self = this
  var target = names[cmp]
  var error = null
  var missing = index.length
  var done = false

  for (var i = 0; i < index.length; i++) {
    this._getAndDecode(index[i], opts, onget)
  }

  function onget (err, node, seq) {
    if (done) return
    if (err) error = err

    if (node && split(node.name)[cmp] === target) {
      self._list(node, seq, names, opts, cb)
      return
    }

    if (!--missing) cb(error, [], [])
  }
}

Tree.prototype.head = function (opts, cb) {
  if (typeof opts === 'function') return this.head(null, opts)
  if (this._head >= this._offset) return this._getAndDecode(this._head, opts, cb)
  if (this._readonly) return cb(null, null, -1)

  var self = this

  this.ready(function (err) {
    if (err) return cb(err)
    if (self.feed.length > self._offset) self._getAndDecode(self.feed.length - 1, opts, cb)
    else cb(null, null, -1)
  })
}

Tree.prototype.ready = function (cb) {
  var self = this

  this.feed.ready(function (err) {
    if (err) return cb(err)
    if ((self.version === -1 || self._head === -1) && self.feed.length > self._offset) self.version = self.feed.length - 1
    cb(null)
  })
}

Tree.prototype.history = function (opts) {
  opts = this._defaultOpts(opts)

  if (this._offset) opts.start = Math.max(opts.start || 0, this._offset)
  if (this._head > -1) opts.end = this._head + 1

  var version = opts.start || 0
  var self = this

  opts.valueEncoding = {
    encode: function () {},
    decode: function (buf) {
      return self._node(messages.Node.decode(buf), version++)
    }
  }

  return this.feed.createReadStream(opts)
}

Tree.prototype.diff = function (toTree, opts) {
  if (typeof toTree === 'number') toTree = this.checkout(toTree)
  opts = this._defaultOpts(opts)

  var fromTree = this
  var diffPuts = opts.puts !== false
  var diffDels = opts.dels !== false
  var queue = ['/']
  var first = true
  var forceVisit = {}

  if (opts.reverse) {
    fromTree = toTree
    toTree = this
  }

  var stream = from.obj(read)
  return stream

  function firstRead (size, cb) {
    first = false
    toTree.head(function (err, head) {
      if (err) return cb(err)
      if (!head || head.value) return read(size, cb)

      var parts = head.name.split('/')
      for (var i = 0; i < parts.length; i++) {
        forceVisit[parts.slice(0, i).join('/') || '/'] = true
      }

      read(size, cb)
    })
  }

  function read (size, cb) {
    if (first) return firstRead(size, cb)
    if (!queue.length) return cb(null, null)
    visit(queue.shift(), function (err, result) {
      if (err) return cb(err)
      if (!result.length) return read(size, cb)
      for (var i = 0; i < result.length - 1; i++) {
        stream.push(result[i])
      }
      cb(null, result[result.length - 1])
    })
  }

  function push (dir, isPut, node, visited, result) {
    if (isPut && !diffPuts) return
    if (!isPut && !diffDels) return

    var name = node.name
    var nameDir = parseDir(dir, node.name)

    if (name === nameDir) {
      result.push({
        type: isPut ? 'put' : 'del',
        name: node.name,
        version: node.version,
        value: node.value
      })
    }

    if (!visited.hasOwnProperty(nameDir)) {
      visited[nameDir] = true
      queue.push(nameDir)
    }
  }

  function parseDir (dir, name) {
    return '/' + split(name).slice(0, split(dir).length + 1).join('/')
  }

  function visit (dir, cb) {
    var visited = {}

    toTree.list(dir, {node: true}, function (err, a) {
      if (err && !err.notFound) return cb(err)
      if (!a) a = []

      fromTree.list(dir, {node: true}, function (err, b) {
        if (err && !err.notFound) return cb(err)
        if (!b) b = []

        var result = []
        var i = 0
        var j = 0

        while (i < a.length && j < b.length) {
          if (a[i].version === b[j].version) {
            var nameDir = parseDir(dir, a[i].name)
            if (forceVisit.hasOwnProperty(nameDir) && !visited[nameDir]) {
              visited[nameDir] = true
              queue.push(nameDir)
            }
            i++
            j++
          } else if (a[i].version < b[j].version) {
            push(dir, true, a[i++], visited, result)
          } else {
            push(dir, false, b[j++], visited, result)
          }
        }

        for (; i < a.length; i++) push(dir, true, a[i], visited, result)
        for (; j < b.length; j++) push(dir, false, b[j], visited, result)

        cb(null, result)
      })
    })
  }
}

Tree.prototype._node = function (node, version) {
  return {
    type: node.value ? 'put' : 'del',
    version: version,
    name: node.name,
    value: node.value && this._codec.decode(node.value)
  }
}

Tree.prototype._init = function (names, value, cb) {
  var index = []

  while (names.length >= index.length) {
    index.push([this.feed.length])
  }

  var node = {
    name: join(names),
    value: this._codec.encode(value),
    paths: this._deflate(this.feed.length, index)
  }

  this.version = this.feed.length
  this.feed.append(messages.Node.encode(node), cb)
}

Tree.prototype._getAndDecode = function (seq, opts, cb) {
  if (opts && opts.cached) opts.wait = false

  var self = this
  var cached = this._cache && this._cache.get(seq)
  if (cached) return nextTick(cb, null, cached, seq)

  this.feed.get(seq, opts, function (err, value) {
    if (err) return cb(err)
    var node = new Node(messages.Node.decode(value), seq)
    if (self._cache) self._cache.set(seq, node)
    cb(null, node, seq)
  })
}

Tree.prototype._getAll = function (seqs, opts, cb) {
  if (opts && opts.cached) seqs = this._onlyCached(seqs)

  var nodes = new Array(seqs.length)
  var missing = seqs.length
  var error = null

  if (!missing) return cb(null, nodes, seqs)
  for (var i = 0; i < seqs.length; i++) this._getAndDecode(seqs[i], opts, get)

  function get (err, node, seq) {
    if (err) error = err
    else nodes[seqs.indexOf(seq)] = node
    if (--missing) return
    if (error) cb(error)
    else cb(null, nodes, seqs)
  }
}

Tree.prototype._onlyCached = function (seqs) {
  var cachedSeqs = []

  for (var i = 0; i < seqs.length; i++) {
    if (this.feed.has(seqs[i])) cachedSeqs.push(seqs[i])
  }

  return cachedSeqs
}

Tree.prototype._deflate = function (seq, index) {
  var endsWithSeq = true
  var lenIsh = 11
  var i = 0
  var idx

  for (i = 0; i < index.length; i++) {
    idx = index[i]

    lenIsh += idx.length * 11 + 11
    if (idx[idx.length - 1] !== seq) endsWithSeq = false
  }

  var header = 0
  if (endsWithSeq) header |= 1

  var buf = new Buffer(lenIsh)
  var offset = 0

  buf[offset++] = header

  for (i = 0; i < index.length; i++) {
    idx = index[i]

    var prev = 0
    var len = endsWithSeq ? idx.length - 1 : idx.length

    varint.encode(len, buf, offset)
    offset += varint.encode.bytes

    for (var j = 0; j < len; j++) {
      varint.encode(idx[j] - prev, buf, offset)
      offset += varint.encode.bytes
      prev = idx[j]
    }
  }

  if (offset > buf.length) throw new Error('Assert error: buffer length too small')
  return buf.slice(0, offset)
}

Tree.prototype._inflate = function (seq, buf) {
  var offset = 0

  var header = varint.decode(buf, offset)
  offset += varint.decode.bytes

  var endsWithSeq = !!(header & 1)
  var index = []

  while (offset < buf.length) {
    var len = varint.decode(buf, offset) // TODO: sanity check this length
    offset += varint.decode.bytes

    var seqs = new Array(endsWithSeq ? len + 1 : len)
    var i = 0

    for (; i < len; i++) {
      if (offset >= buf.length) throw new Error('Invalid index')

      seqs[i] = varint.decode(buf, offset) + (i ? seqs[i - 1] : 0)
      offset += varint.decode.bytes
    }

    if (endsWithSeq) seqs[i] = seq
    index.push(seqs)
  }

  return index
}

Tree.prototype._defaultOpts = function (opts) {
  if (!opts) return {wait: this._wait, cached: this._cached, node: this._asNode}
  if (opts.wait === undefined) opts.wait = this._wait
  if (opts.cached === undefined) opts.cached = this._cached
  if (opts.node === undefined) opts.noce = this._asNode
  return opts
}

function join (names) {
  return '/' + names.join('/')
}

function split (name) {
  var list = name.split('/')
  if (list[0] === '') list.shift()
  if (list[list.length - 1] === '') list.pop()
  return list
}

function notFound (names) {
  var err = new Error(join(names) + ' could not be found')
  err.notFound = true
  err.status = 404
  return err
}

function compare (a, b) {
  var idx = 0
  while (idx < a.length && a[idx] === b[idx]) idx++
  return idx
}

function Node (node, seq) {
  this.index = seq
  this.name = node.name
  this.value = node.value
  this.paths = node.paths
}

function getCache (opts) {
  if (opts.cache === false) return null
  if (opts.cache === true || !opts.cache) return cache(65536, {indexedValues: true})
  return opts.cache
}
