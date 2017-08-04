var assert = require('nanoassert')
var randombytes = (function () {
  var QUOTA = 65536 // limit for QuotaExceededException
  var crypto = typeof window !== 'undefined' ? (window.crypto || window.msCrypto) : null

  function windowBytes (out, n) {
    for (var i = 0; i < n; i += QUOTA) {
      crypto.getRandomValues(out.subarray(i, i + Math.min(n - i, QUOTA)))
    }
  }

  function nodeBytes (out, n) {
    out.set(crypto.randomBytes(n))
  }

  function noImpl () {
    throw new Error('No secure random number generator available')
  }

  if (crypto && crypto.getRandomValues) {
    return windowBytes
  } else if (typeof require !== 'undefined') {
    // Node.js.
    crypto = require('cry' + 'pto');
    if (crypto && crypto.randomBytes) {
      return nodeBytes
    }
  }

  return noImpl
})()

Object.defineProperty(module.exports, 'randombytes', {
  value: randombytes
})

module.exports.randombytes_buf = function (out) {
  assert(out, 'out must be given')
  randombytes(out, out.length)
}
