# sodium-universal

Universal wrapper for `sodium-javascript` and `sodium-native` working in Node.js and the Browser

```sh
npm install sodium-universal
```

## Usage

```js
var sodium = require('sodium-universal')

var rnd = Buffer.allocUnsafe(12) // Cryptographically random data
sodium.randombytes_buf(rnd)

console.log(rnd.toString('hex'))

```

Works seamlessly with Node.js:

```sh
$ node example.js
c7dbd46a6cc84ff2e0d1285c
```

And the browser:

```sh
browserify example.js > bundle.js
```

## Introduction

[`libsodium`](https://download.libsodium.org/doc/) is a collection of cryptographic primitives, providing a low-level foundation to build higher-level cryptographic applications and protocols. It is often put in contrast to RSA based cryptography and OpenSSL, even though they all share overlapping algorithms and target slightly different audiences. Sodium is a collection of modern collection of primitives, fulfilling the same cryptographic tasks, but based on simpler and more efficient algorithms.

This library provides seamless bindings to [`sodium-native`](https://github.com/sodium-friends/sodium-native), which is the original C implementation of `libsodium` exposed as a Node native module. For the browser we expose [`sodium-javascript`](https://github.com/sodium-friends/sodium-javascript), using the `package.json` [`browser`](https://github.com/defunctzombie/package-browser-field-spec) field, which is supported by most bundlers.

## API

Please refer to [`sodium-native`](https://github.com/sodium-friends/sodium-native#api) and [`sodium-javascript`](https://github.com/sodium-friends/sodium-javascript#api). Note that the two modules do not yet have feature parity, where `sodium-native` is the more featureful of the two.

## License

[MIT](LICENSE.md)
