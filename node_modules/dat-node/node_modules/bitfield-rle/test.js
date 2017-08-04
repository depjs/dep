var tape = require('tape')
var bitfield = require('bitfield')
var rle = require('./')

tape('encodes and decodes', function (t) {
  var bits = bitfield(1024)
  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, trim(bits.buffer), 'decodes to same buffer')
  t.end()
})

tape('encodingLength', function (t) {
  var bits = bitfield(1024)
  var len = rle.encodingLength(bits.buffer)
  t.ok(len < bits.buffer.length, 'is smaller')
  var deflated = rle.encode(bits.buffer)
  t.same(len, deflated.length, 'encoding length is similar to encoded buffers length')
  t.end()
})

tape('encodes and decodes with all bits set', function (t) {
  var bits = bitfield(1024)

  for (var i = 0; i < 1024; i++) bits.set(i, true)

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, trim(bits.buffer), 'decodes to same buffer')
  t.end()
})

tape('encodes and decodes with some bits set', function (t) {
  var bits = bitfield(1024)

  bits.set(500, true)
  bits.set(501, true)
  bits.set(502, true)

  bits.set(999, true)
  bits.set(1000, true)
  bits.set(0, true)

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, trim(bits.buffer), 'decodes to same buffer')
  t.end()
})

tape('encodes and decodes with random bits set', function (t) {
  var bits = bitfield(8 * 1024)

  for (var i = 0; i < 512; i++) {
    bits.set(Math.floor(Math.random() * 8 * 1024), true)
  }

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, trim(bits.buffer), 'decodes to same buffer')
  t.end()
})

tape('encodes and decodes with random bits set (not power of two)', function (t) {
  var bits = bitfield(8 * 1024)

  for (var i = 0; i < 313; i++) {
    bits.set(Math.floor(Math.random() * 8 * 1024), true)
  }

  var deflated = rle.encode(bits.buffer)
  t.ok(deflated.length < bits.buffer.length, 'is smaller')
  var inflated = rle.decode(deflated)
  t.same(inflated, trim(bits.buffer), 'decodes to same buffer')
  t.end()
})

tape('encodes empty bitfield', function (t) {
  var deflated = rle.encode(new Buffer(0))
  var inflated = rle.decode(deflated)
  t.same(inflated, new Buffer(0), 'still empty')
  t.end()
})

tape('throws on bad input', function (t) {
  t.throws(function () {
    rle.decode(new Buffer([100]))
  }, 'invalid delta count')
  t.throws(function () {
    rle.decode(new Buffer([10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0, 10, 0]))
  }, 'missing delta')
  t.end()
})

tape('not power of two', function (t) {
  var deflated = rle.encode(new Buffer([255, 255, 255, 240]))
  var inflated = rle.decode(deflated)
  t.same(inflated, new Buffer([255, 255, 255, 240]), 'output equal to input')
  t.end()
})

function trim (b) {
  var len = b.length
  while (len > 0 && !b[len - 1]) len--
  return b.slice(0, len)
}
