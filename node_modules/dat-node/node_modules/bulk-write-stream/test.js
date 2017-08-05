var tape = require('tape')
var bulk = require('./')

tape('input matches', function (t) {
  var expected = ['a', 'b', 'c', 'd']
  var clone = expected.slice(0)

  var ws = bulk.obj(function (list, cb) {
    while (list.length) t.same(list.shift(), expected.shift())
    process.nextTick(cb)
  })

  for (var i = 0; i < clone.length; i++) ws.write(clone[i])

  ws.end(function () {
    t.end()
  })
})

tape('bulk list', function (t) {
  var expected = [['a'], ['b', 'c', 'd']]

  var ws = bulk.obj(function (list, cb) {
    t.same(list, expected.shift())
    process.nextTick(cb)
  })

  ws.write('a')
  ws.write('b')
  ws.write('c')
  ws.write('d')

  ws.end(function () {
    t.end()
  })
})

tape('flush one', function (t) {
  var expected = [[new Buffer('a')]]
  var flushed = false

  var ws = bulk(function (list, cb) {
    t.same(list, expected.shift())
    process.nextTick(cb)
  }, function (cb) {
    flushed = true
    cb()
  })

  ws.write('a')

  ws.end(function () {
    t.ok(flushed)
    t.end()
  })
})

tape('flush', function (t) {
  var expected = [['a'], ['b', 'c', 'd']]
  var flushed = false

  var ws = bulk.obj(function (list, cb) {
    t.same(list, expected.shift())
    process.nextTick(cb)
  }, function (cb) {
    flushed = true
    cb()
  })

  ws.write('a')
  ws.write('b')
  ws.write('c')
  ws.write('d')

  ws.end(function () {
    t.ok(flushed)
    t.end()
  })
})

tape('flush binary', function (t) {
  var expected = [[new Buffer('a')], [new Buffer('b'), new Buffer('c'), new Buffer('d')]]
  var flushed = false

  var ws = bulk.obj(function (list, cb) {
    t.same(list, expected.shift())
    process.nextTick(cb)
  }, function (cb) {
    flushed = true
    cb()
  })

  ws.write(new Buffer('a'))
  ws.write(new Buffer('b'))
  ws.write(new Buffer('c'))
  ws.write(new Buffer('d'))

  ws.end(function () {
    t.ok(flushed)
    t.end()
  })
})
