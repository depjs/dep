var tweetnacl = require('tweetnacl')

exports.keyPair = function (seed) {
  var publicKey = Buffer(tweetnacl.lowlevel.crypto_sign_PUBLICKEYBYTES)
  var secretKey = Buffer(tweetnacl.lowlevel.crypto_sign_SECRETKEYBYTES)

  if (seed) {
    if (seed.length !== tweetnacl.lowlevel.crypto_sign_SEEDBYTES) {
      throw new Error('Seed must be ' + tweetnacl.lowlevel.crypto_sign_SEEDBYTES + ' bytes long')
    }

    secretKey.fill(seed, 0, seed.length)
    tweetnacl.lowlevel.crypto_sign_keypair(publicKey, secretKey, true)
  } else {
    tweetnacl.lowlevel.crypto_sign_keypair(publicKey, secretKey)
  }

  return {publicKey: publicKey, secretKey: secretKey}
}

exports.verify = function (message, signature, publicKey) {
  return tweetnacl.sign.detached.verify(message, signature, publicKey)
}

exports.sign = function (message, secretKey) {
  return Buffer(tweetnacl.sign.detached(message, secretKey))
}
