var tape = require('tape')
var codecs = require('./')

tape('json', function (t) {
  var enc = codecs('json')
  t.same(enc.encode({}), new Buffer('{}'))
  t.same(enc.decode(new Buffer('{}')), {})
  t.end()
})

tape('utf-8', function (t) {
  var enc = codecs('utf-8')
  t.same(enc.encode('hello world'), new Buffer('hello world'))
  t.same(enc.decode(new Buffer('hello world')), 'hello world')
  t.end()
})

tape('hex', function (t) {
  var enc = codecs('hex')
  t.same(enc.encode('abcd'), new Buffer([0xab, 0xcd]))
  t.same(enc.decode(new Buffer([0xab, 0xcd])), 'abcd')
  t.end()
})

tape('binary', function (t) {
  var enc = codecs()
  t.same(enc.encode('hello world'), new Buffer('hello world'))
  t.same(enc.encode(new Buffer('hello world')), new Buffer('hello world'))
  t.same(enc.decode(new Buffer('hello world')), new Buffer('hello world'))
  t.end()
})

tape('custom', function (t) {
  var enc = codecs({
    encode: function () {
      return new Buffer('lol')
    },
    decode: function () {
      return 42
    }
  })

  t.same(enc.encode('hello'), new Buffer('lol'))
  t.same(enc.encode(42), new Buffer('lol'))
  t.same(enc.decode(new Buffer('lol')), 42)
  t.end()
})
