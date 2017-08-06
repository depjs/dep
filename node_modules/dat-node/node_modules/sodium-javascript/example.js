var sodium = require('./')

var key = new Buffer(sodium.crypto_secretbox_KEYBYTES)
var nonce = new Buffer(sodium.crypto_secretbox_NONCEBYTES)

sodium.randombytes_buf(key)
sodium.randombytes_buf(nonce)

var message = new Buffer('Hello, World!')
var cipher = new Buffer(message.length + sodium.crypto_secretbox_MACBYTES)

sodium.crypto_secretbox_easy(cipher, message, nonce, key)

console.log('Encrypted:', cipher)

var plainText = new Buffer(cipher.length - sodium.crypto_secretbox_MACBYTES)

sodium.crypto_secretbox_open_easy(plainText, cipher, nonce, key)

console.log('Plaintext:', plainText.toString())
