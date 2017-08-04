# sodium-javascript

WIP - a pure javascript version of [sodium-native](https://github.com/mafintosh/sodium-native).
Based on tweetnacl

```
npm install sodium-javascript
```

## Usage

``` js
var sodium = require('sodium-javascript')

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
```

## API

See [sodium-native](https://github.com/mafintosh/sodium-native).
This is a work in progress so all functions are not implemented yet.

## License

MIT
