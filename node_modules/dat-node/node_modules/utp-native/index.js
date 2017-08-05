var events = require('events')
var util = require('util')
var timers = require('timers')
var stream = require('readable-stream')
var utp = require('node-gyp-build')(__dirname)
var net = require('net')
var dns = require('dns')

var UTP_ERRORS = [
  'UTP_ECONNREFUSED',
  'UTP_ECONNRESET',
  'UTP_ETIMEDOUT'
]

var IPV4_ONLY = new Error('Only IPv4 is supported currently. Open an issue for IPv6 support')
var unenroll = timers.unenroll || noop
var active = timers._unrefActive || timers.active || noop
var enroll = timers.enroll || noop

module.exports = UTP

function UTP () {
  if (!(this instanceof UTP)) return new UTP()
  events.EventEmitter.call(this)

  this.connections = []

  this._refs = 1
  this._closed = false
  this._bound = false
  this._firewalled = true
  this._maxConnections = 0
  this._sending = new Array(64)
  this._sendingFree = []
  this._sendingPending = []
  for (var i = 63; i >= 0; i--) this._sendingFree.push(i)

  this._handle = utp.utp()
  this._handle.context(this)
  this._handle.onclose(this._onclose)
  this._handle.onmessage(this._onmessage)
  this._handle.onsend(this._onsend)
  this._handle.onerror(this._onerror)
}

util.inherits(UTP, events.EventEmitter)

UTP.createServer = function (onconnection) {
  var server = UTP()
  if (onconnection) server.on('connection', onconnection)
  return server
}

UTP.client = null // reuse a global client

UTP.connect = function (port, host) {
  if (UTP.client) return UTP.client.connect(port, host)
  UTP.client = UTP()
  UTP.client.once('closeable', oncloseable)
  return UTP.client.connect(port, host)
}

function oncloseable () {
  UTP.client.close()
  UTP.client.on('error', noop)
  UTP.client = null
}

UTP.prototype._onmessage = function (buf, rinfo) {
  this.emit('message', buf, rinfo)
}

UTP.prototype._onsend = function (ptr, error) {
  var req = this._sending[ptr]
  this._sending[ptr] = null
  this._sendingFree.push(ptr)
  this._free()
  if (error) req.callback(new Error('Send failed'))
  else req.callback(null, req.buffer.length)
}

UTP.prototype._onclose = function () {
  this._handle = null
  this.emit('close')
}

UTP.prototype._onerror = function () {
  this.emit(new Error('Unknown UDP error'))
}

UTP.prototype.address = function () {
  return this._handle.address()
}

UTP.prototype.send = function (buf, offset, len, port, host, cb) {
  if (typeof host === 'function') return this.send(buf, offset, len, port, null, host)
  if (!Buffer.isBuffer(buf)) throw new Error('Buffer should be a buffer')
  if (typeof offset !== 'number') throw new Error('Offset should be a number')
  if (typeof len !== 'number') throw new Error('Length should be a number')
  if (typeof port !== 'number') throw new Error('Port should be a number')
  if (host && typeof host !== 'string') throw new Error('Host should be a string')

  if (!this._bound) this.bind()
  if (!cb) cb = noop
  if (host && !net.isIPv4(host)) return this._resolveAndSend(buf, offset, len, port, host, cb)
  if (!this._sendingFree.length) return this._deferSend(buf, offset, len, port, host, cb)

  var free = this._sendingFree.pop()
  this._sending[free] = new SendRequest(buf, offset, len, port, host, cb)

  try {
    this._handle.send(free, buf, offset, len, Number(port), host || '127.0.0.1')
  } catch (err) {
    this._sending[free] = null
    this._sendingFree.push(free)
    this._free()
    next(cb, err)
  }
}

Object.defineProperty(UTP.prototype, 'maxConnections', {
  get: function () {
    return this._maxConnections
  },
  set: function (val) {
    this._maxConnections = val
    this._handle.maxSockets(val)
  }
})

UTP.prototype._deferSend = function (buf, offset, len, port, host, cb) {
  this._sendingPending.push(new SendRequest(buf, offset, len, port, host, cb))
}

UTP.prototype._free = function () {
  if (this._sendingPending.length) {
    var req = this._sendingPending.shift()
    this.send(req.buffer, req.offset, req.length, req.port, req.host, req.callback)
  }
}

UTP.prototype._resolveAndSend = function (buf, offset, len, port, host, cb) {
  if (!cb) cb = noop
  var self = this
  dns.lookup(host, function (err, ip, family) {
    if (err) return cb(err)
    if (family !== 4) return cb(IPV4_ONLY)
    self.send(buf, offset, len, port, ip, cb)
  })
}

UTP.prototype.connect = function (port, host) {
  if (port && typeof port === 'object') return this.connect(port.port, port.host)
  if (typeof port === 'string') port = Number(port)
  if (host && typeof host !== 'string') throw new Error('Host should be a string')
  if (!port) throw new Error('Port should be a number')

  if (!this._bound) this.bind()

  var conn = new Connection(this)

  if (!host || net.isIPv4(host)) conn._connect(port, host || '127.0.0.1')
  else conn._resolveAndConnect(port, host)

  return conn
}

UTP.prototype.bind = function (port, ip, onlistening) {
  if (typeof port === 'function') return this.bind(0, null, port)
  if (typeof ip === 'function') return this.bind(port, null, ip)
  if (ip && typeof ip !== 'string') throw new Error('IP must be a string')

  if (onlistening) this.once('listening', onlistening)

  if (this._bound) throw new Error('Socket is already bound')

  try {
    this._handle.bind(Number(port) || 0, ip || '0.0.0.0')
    this._bound = true
  } catch (err) {
    emit(this, 'error', err)
    return
  }

  emit(this, 'listening')
}

UTP.prototype.listen = function (port, ip, onlistening) {
  if (this._bound && port) throw new Error('Socket is already bound')
  if (port !== undefined) this.bind(port, ip, onlistening)
  else this.bind()

  if (!this._firewalled) return
  this._firewalled = false
  this._handle.onsocket(this._onsocket)
}

UTP.prototype._onsocket = function (socket) {
  this.emit('connection', new Connection(this, socket))
}

UTP.prototype.ref = function () {
  if (++this._refs === 1) this._handle.ref()
}

UTP.prototype.unref = function () {
  if (--this._refs === 0) this._handle.unref()
}

UTP.prototype.close = function (cb) {
  if (this._handle) {
    if (cb) this.once('close', cb)
    if (this._closed) return
    this._closed = true
    this._handle.destroy()
    return
  }

  if (cb) process.nextTick(cb)
}

function Connection (utp, socket) {
  stream.Duplex.call(this)

  this._utp = utp
  this._socket = null
  this._index = this._utp.connections.push(this) - 1
  this._dataReq = null
  this._batchReq = null
  this._drain = null
  this._ended = false
  this._resolved = false

  // set by timer
  this._idleTimeout = -1
  this._idleNext = null
  this._idlePrev = null
  this._idleStart = 0
  this._called = false

  this.destroyed = false
  this.on('finish', this._onend)

  if (socket) this._onsocket(socket)
}

util.inherits(Connection, stream.Duplex)

Connection.prototype._connect = function (port, ip) {
  if (this._utp) this._onsocket(this._utp._handle.connect(port, ip || '127.0.0.1'))
}

Connection.prototype._onTimeout = function () {
  this.emit('timeout')
}

Connection.prototype._resolveAndConnect = function (port, host) {
  var self = this
  dns.lookup(host, function (err, ip, family) {
    if (self.destroyed) return
    self._resolved = true
    if (err) return self.destroy(err)
    if (family !== 4) return self.destroy(IPV4_ONLY)
    self._connect(port, ip)
  })
}

Connection.prototype.setTimeout = function (ms, ontimeout) {
  if (!ms) {
    unenroll(this)
    if (ontimeout) this.removeListener('timeout', ontimeout)
  } else if (!this.destroyed) {
    enroll(this, ms)
    active(this)
    if (ontimeout) this.once('timeout', ontimeout)
  }
  return this
}

Connection.prototype._onsocket = function (socket) {
  this._resolved = true
  this._socket = socket

  socket.context(this)
  socket.ondrain(this._ondrain)
  socket.ondata(this._ondata)
  socket.onend(this._onend)
  socket.onclose(this._onclose)
  socket.onerror(this._onerror)
  socket.onconnect(this._onconnect)

  this.emit('resolve')
}

Connection.prototype._onclose = function () {
  this.destroyed = true
  this._cleanup()
  this.emit('close')
}

Connection.prototype._ondrain = function () {
  var drain = this._drain
  this._drain = null
  this._batchReq = null
  this._dataReq = null
  if (drain) drain()
}

Connection.prototype._ondata = function (data) {
  if (this.destroyed) return
  active(this)
  this.push(data)
}

Connection.prototype._onerror = function (error) {
  this.destroy(new Error(UTP_ERRORS[error] || 'UTP_UNKNOWN_ERROR'))
}

Connection.prototype._onconnect = function () {
  this.emit('connect')
}

Connection.prototype.ref = function () {
  this._utp.ref()
}

Connection.prototype.unref = function () {
  this._utp.unref()
}

Connection.prototype.address = function () {
  return this._utp && this._utp.address()
}

Connection.prototype._write = function (data, enc, cb) {
  if (this.destroyed) return cb()
  if (!this._resolved) return this.once('resolve', this._write.bind(this, data, enc, cb))
  active(this)

  if (this._socket.write(data)) return cb()
  this._dataReq = data
  this._drain = cb
}

Connection.prototype._writev = function (batch, cb) {
  if (this.destroyed) return cb()
  if (!this._resolved) return this.once('resolve', this._writev.bind(this, batch, cb))
  active(this)

  if (this._socket.writev(batch)) return cb()
  this._batchReq = batch
  this._drain = cb
}

Connection.prototype._onend = function () {
  if (!this._resolved) return this.once('resolve', this._onend)
  if (this._ended) return
  this._ended = true
  if (this._socket) this._socket.end()
  if (!this.destroyed) this.push(null)
}

Connection.prototype.destroy = function (err) {
  if (!this._resolved) return this.once('resolve', this._destroy.bind(this, err))
  if (this.destroyed) return
  this.destroyed = true

  unenroll(this)
  if (err) this.emit('error', err)

  this._onend()

  if (!this._socket) {
    this._cleanup()
    this.emit('close')
  }
}

Connection.prototype._read = function () {
  // no readable backpressure atm
}

Connection.prototype._cleanup = function () {
  var last = this._utp.connections.pop()
  if (last !== this) {
    this._utp.connections[this._index] = last
    last._index = this._index
  }

  if (!this._utp.connections.length) this._utp.emit('closeable')
  unenroll(this)
  this._utp = null
  this._socket = null
}

function SendRequest (buffer, offset, len, port, host, callback) {
  this.buffer = buffer
  this.offset = offset
  this.length = len
  this.port = port
  this.host = host
  this.callback = callback
}

function next (fn, arg) {
  process.nextTick(function () {
    fn(arg)
  })
}

function emit (self, name, arg) {
  process.nextTick(function () {
    if (arg) self.emit(name, arg)
    else self.emit(name)
  })
}

function noop () {}
