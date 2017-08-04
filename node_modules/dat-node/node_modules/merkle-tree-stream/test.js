var tape = require('tape')
var crypto = require('crypto')
var merkleStream = require('./')

tape('hashes', function (t) {
  var stream = merkleStream({
    leaf: function (leaf) {
      return hash([leaf.data])
    },
    parent: function (a, b) {
      return hash([a.hash, b.hash])
    }
  })

  stream.write('a')
  stream.write('b')
  stream.end()

  var expected = [{
    index: 0,
    parent: 1,
    hash: hash(['a']),
    size: 1,
    data: new Buffer('a')
  }, {
    index: 2,
    parent: 1,
    hash: hash(['b']),
    size: 1,
    data: new Buffer('b')
  }, {
    index: 1,
    parent: 3,
    size: 2,
    hash: hash([hash(['a']), hash(['b'])]),
    data: null
  }]

  stream.on('data', function (data) {
    t.same(data, expected.shift(), 'hashes data')
  })

  stream.on('end', function () {
    t.same(expected.length, 0, 'no more data')
    t.end()
  })
})

tape('one root on power of two', function (t) {
  var stream = merkleStream({
    leaf: function (leaf) {
      return hash([leaf.data])
    },
    parent: function (a, b) {
      return hash([a.hash, b.hash])
    }
  })

  stream.write('a')
  stream.write('b')
  stream.write('c')
  stream.write('d')
  stream.end()

  stream.resume()
  stream.on('end', function () {
    t.same(stream.roots.length, 1, 'one root')
    t.end()
  })
})

tape('multiple roots if not power of two', function (t) {
  var stream = merkleStream({
    leaf: function (leaf) {
      return hash([leaf.data])
    },
    parent: function (a, b) {
      return hash([a.hash, b.hash])
    }
  })

  stream.write('a')
  stream.write('b')
  stream.write('c')
  stream.end()

  stream.resume()
  stream.on('end', function () {
    t.ok(stream.roots.length > 1, 'more than one root')
    t.end()
  })
})

function hash (list) {
  var sha = crypto.createHash('sha256')
  for (var i = 0; i < list.length; i++) sha.update(list[i])
  return sha.digest()
}
