# siphash24

[SipHash](https://en.wikipedia.org/wiki/SipHash) (2-4) implemented in pure Javascript and WebAssembly.

```
npm install siphash24
```

The Javascript fallback is adapted from [https://github.com/jedisct1/siphash-js](https://github.com/jedisct1/siphash-js) to support Uint8Arrays
and the (fast!) WebAssembly implementation is hand written.

When using the WASM implementation this module is almost as fast as the C version (around 10% slower on my laptop).

## Usage

``` js
var siphash24 = require('siphash24')
var hash = siphash24(new Buffer('hello world'), new Buffer('012345678012345678'))

console.log(hash, 'hash of "hello world" as a uint8array')
```

## API

#### `var hash = siphash24(input, key, [hash])`

Hash a Uint8Array/buffer using siphash24.

* `key` should be a Uint8Array/buffer that is `siphash24.KEYBYTES` long
* `hash` can to be optionally passed as the output buffer and should be `siphash24.BYTES` long.

Returns the hash as a Uint8Array.

#### `siphash24.WASM_SUPPORTED`

Boolean informing you if your runtime supports WASM.

#### `siphash24.WASM_LOADED`

Boolean informing you if the WASM implementation has been loaded.

#### `siphash24.ready(callback)`

Wait for WASM to be loaded. If you call `siphash24` before the WASM has been loaded it will simply use the Javascript fallback.

## License

MIT
