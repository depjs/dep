'use strict'

var Buffer = require('safe-buffer').Buffer

function encode (buf) {
  if (typeof buf === 'string') return encode(decode(buf))
  if (!Buffer.isBuffer(buf)) throw new Error('Not a buffer')
  if (buf.length !== 32) throw new Error('Invalid buffer')
  return buf.toString('hex')
}

function decode (str) {
  if (Buffer.isBuffer(str)) return decode(encode(str))
  if (typeof str !== 'string') throw new Error('Not a string')
  var match = /\/?([^/]{64})/.exec(str)
  if (!match) throw new Error('Invalid key')
  return Buffer.from(match[1], 'hex')
}

exports.encode = exports.toStr = encode
exports.decode = exports.toBuf = decode
