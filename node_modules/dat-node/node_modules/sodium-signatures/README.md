# sodium-signatures

[Sodium signatures](https://github.com/paixaop/node-sodium) that works in node and in the browser

```
npm install sodium-signatures
```

[![build status](http://img.shields.io/travis/mafintosh/sodium-signatures.svg?style=flat)](http://travis-ci.org/mafintosh/sodium-signatures)

## Usage

``` js
var signatures = require('sodium-signatures')

var keys = signatures.keyPair()
var message = new Buffer('a message')

var signature = signatures.sign(message, keys.secretKey)
var verified = signatures.verify(message, signature, keys.publicKey)

console.log('message was verified', verified)
```

## API

#### `keys = signatures.keyPair([seed])`

Generate a public key and a secret key, optionally using a 32-byte `seed`
(`crypto_sign_SEEDBYTES` defines this length)

#### `signature = signature.sign(message, secretKey)`

Sign a message.

#### `verified = signature.verify(message, signature, publicKey)`

Verify a message and signature.

## License

MIT
