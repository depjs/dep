var siphash = require('siphash24')

exports.crypto_shorthash_PRIMITIVE = 'siphash24'
exports.crypto_shorthash_BYTES = siphash.BYTES
exports.crypto_shorthash_KEYBYTES = siphash.KEYBYTES
exports.crypto_shorthash_WASM_SUPPORTED = siphash.WASM_SUPPORTED
exports.crypto_shorthash_WASM_LOADED = siphash.WASM_LOADED
exports.crypto_shorthash_ready = siphash.ready
exports.crypto_shorthash = shorthash

siphash.ready(function () {
  exports.crypto_shorthash_WASM_LOADED = siphash.WASM_LOADED
})

function shorthash (out, data, key, noAssert) {
  siphash(data, key, out, noAssert)
}
