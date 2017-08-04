var rle = require('./')
var bitfield = require('bitfield')

var bits = bitfield(1024)

bits.set(400, true) // set bit 400

var enc = rle.encode(bits.buffer) // rle encode the bitfield
console.log(enc.length) // 6 bytes
var dec = rle.decode(enc) // decode the rle encoded buffer
console.log(dec.length) // 128 bytes (like the old bitfield)

bits = bitfield(dec)
console.log(bits.get(400)) // still returns true
