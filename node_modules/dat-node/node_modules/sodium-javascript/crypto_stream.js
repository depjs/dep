var xsalsa20 = require('xsalsa20')

exports.crypto_stream_KEYBYTES = 32
exports.crypto_stream_NONCEBYTES = 24
exports.crypto_stream_PRIMITIVE = 'xsalsa20'

exports.crypto_stream = function (out, nonce, key) {
  out.fill(0)
  exports.crypto_stream_xor(out, out, nonce, key)
}

exports.crypto_stream_xor = function (out, inp, nonce, key) {
  var xor = xsalsa20(nonce, key)
  xor.update(inp, out)
  xor.final()
}

exports.crypto_stream_xor_instance = function (nonce, key) {
  return new XOR(nonce, key)
}

function XOR (nonce, key) {
  this._instance = xsalsa20(nonce, key)
}

XOR.prototype.update = function (out, inp) {
  this._instance.update(inp, out)
}

XOR.prototype.final = function () {
  this._instance.finalize()
  this._instance = null
}
