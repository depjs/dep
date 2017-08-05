var test = require('tape')
var enc = require('./')

var keys = [
  {type: 'valid', key: '6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'valid', key: new Buffer('6161616161616161616161616161616161616161616161616161616161616161', 'hex')},
  {type: 'valid', key: 'dat://6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'valid', key: 'dat.land/6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'valid', key: 'dat://6161616161616161616161616161616161616161616161616161616161616161/'},
  {type: 'valid', key: 'dat.land/6161616161616161616161616161616161616161616161616161616161616161/'},
  {type: 'valid', key: 'host.com/whatever/6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'invalid', key: new Buffer('key-me-maybe', 'hex')},
  {type: 'invalid', key: 'key-me-maybe'},
  {type: 'invalid', key: null}
]

test('encode', function (t) {
  keys.forEach(function (key) {
    if (key.type === 'invalid') {
      t.throws(function () { enc.encode(key.key) }, 'invalid key throws error')
    } else if (key.type === 'valid') {
      var newKey = enc.encode(key.key)
      t.equal(newKey, '6161616161616161616161616161616161616161616161616161616161616161')
      t.equal(typeof newKey, 'string')
      t.ok(enc.decode(newKey), 'valid key is now valid str')
    }
  })

  t.equal(enc.encode, enc.toStr)
  t.end()
})

test('decode', function (t) {
  keys.forEach(function (key) {
    if (key.type === 'invalid') {
      t.throws(function () { enc.decode(key.key) }, 'invalid key throws error')
    } else if (key.type === 'valid') {
      var newKey = enc.decode(key.key)
      t.deepEqual(
        newKey,
        Buffer('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      )
      t.deepEqual(
        newKey,
        Buffer('6161616161616161616161616161616161616161616161616161616161616161', 'hex')
      )
      t.ok(Buffer.isBuffer(newKey), 'buffer a is buffer')
      t.ok(enc.encode(newKey), 'valid key is now valid buffer')
    }
  })

  t.equal(enc.decode, enc.toBuf)

  t.end()
})

test('integration', function (t) {
  var input = Buffer('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  t.deepEqual(enc.decode(enc.encode(input)), input)

  input = Buffer('0900000001000000561ce777010000009082e70001000000bf000000ffffffff', 'hex')
  t.deepEqual(enc.decode(enc.encode(input)), input)

  input = Buffer(32)
  t.deepEqual(enc.decode(enc.encode(input)), input)

  t.end()
})

test('toStr', function (t) {
  keys.forEach(function (key) {
    if (key.type === 'valid') {
      var newKey = enc.toStr(key.key)
      t.equal(newKey, '6161616161616161616161616161616161616161616161616161616161616161')
      t.equal(typeof newKey, 'string')
      t.ok(enc.decode(newKey), 'valid key is now valid buf')
    }
  })

  t.end()
})

test('toBuf', function (t) {
  keys.forEach(function (key) {
    if (key.type === 'valid') {
      var newKey = enc.toBuf(key.key)
      t.deepEqual(
        newKey,
        Buffer('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      )
      t.ok(Buffer.isBuffer(newKey), 'buffer a is buffer')
      t.ok(enc.encode(newKey), 'valid key is now valid buffer')
    }
  })

  t.end()
})
