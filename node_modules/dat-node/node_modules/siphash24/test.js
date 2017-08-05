var tape = require('tape')
var siphash24 = require('./')

tape('basic "hello world"', function (t) {
  var out = siphash24(new Buffer('hello world'), new Buffer('abcdefghijklmnop'))
  t.same(new Buffer(out).toString('hex'), 'cc381e910d3720ce')
  siphash24.ready(function () {
    out = siphash24(new Buffer('hello world'), new Buffer('abcdefghijklmnop'))
    t.same(new Buffer(out).toString('hex'), 'cc381e910d3720ce')
    t.end()
  })
})

tape('basic "foo"', function (t) {
  var out = siphash24(new Buffer('foo'), new Buffer('abcdefghijklmnop'))
  t.same(new Buffer(out).toString('hex'), '3f969a1d4c0c0f35')
  siphash24.ready(function () {
    out = siphash24(new Buffer('foo'), new Buffer('abcdefghijklmnop'))
    t.same(new Buffer(out).toString('hex'), '3f969a1d4c0c0f35')
    t.end()
  })
})

tape('pass in output', function (t) {
  var out = new Buffer(8)
  siphash24(new Buffer('foo'), new Buffer('abcdefghijklmnop'), out)
  t.same(new Buffer(out).toString('hex'), '3f969a1d4c0c0f35')
  siphash24.ready(function () {
    out.fill(0)
    siphash24(new Buffer('foo'), new Buffer('abcdefghijklmnop'), out)
    t.same(new Buffer(out).toString('hex'), '3f969a1d4c0c0f35')
    t.end()
  })
})

tape('asserts', function (t) {
  t.throws(function () {
    siphash24()
  })
  t.throws(function () {
    siphash24(new Buffer('hi'), new Buffer(0))
  })
  t.throws(function () {
    siphash24(new Buffer('hi'), new Buffer(8), new Buffer(0))
  })
  t.end()
})
