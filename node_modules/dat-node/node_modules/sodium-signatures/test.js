var tape = require('tape')
var signatures = require('./')

tape('sign and verify', function (t) {
  var keys = signatures.keyPair()
  t.ok(keys.publicKey, 'has public key')
  t.ok(keys.secretKey, 'has secret key')
  var message = new Buffer('hello')
  var sig = signatures.sign(message, keys.secretKey)
  t.ok(signatures.verify(message, sig, keys.publicKey), 'message verifies')
  t.end()
})

tape('sign and verify with seed', function (t) {
  var seed = Buffer([
    123, 321, 123, 321,
    123, 321, 123, 321,
    123, 321, 123, 321,
    123, 321, 123, 321,
    123, 321, 123, 321,
    123, 321, 123, 321,
    123, 321, 123, 321,
    123, 321, 123, 321
  ])

  var keys = signatures.keyPair(seed)
  t.ok(keys.publicKey, 'has public key')
  t.ok(keys.secretKey, 'has secret key')
  var message = new Buffer('hello')
  var sig = signatures.sign(message, keys.secretKey)

  var keys2 = signatures.keyPair(seed)
  t.ok(signatures.verify(message, sig, keys2.publicKey), 'message verifies')
  t.end()
})

tape('throws on seed not crypto_sign_SEEDBYTES long', function (t) {
  t.throws(function () { signatures.keyPair(Buffer(31)) })

  t.end()
})
