var tape = require('tape')
var indexOf = require('./')

tape('basic', function (t) {
  var a = ['b', 'c', 'd', 'e', 'f']
  var b = ['a', 'b', 'c', 'f', 'g', 'h']

  t.same(indexOf(a, b), [-1, 0, 1, 4, -1, -1])
  t.end()
})

tape('same', function (t) {
  var a = ['b', 'c', 'd', 'e', 'f']
  var b = ['b', 'c', 'd', 'e', 'f']

  t.same(indexOf(a, b), [0, 1, 2, 3, 4])
  t.end()
})

tape('dups', function (t) {
  var a = ['a', 'b', 'b', 'b', 'e', 'f']
  var b = ['b', 'b', 'b', 'b', 'c', 'e', 'f']

  t.same(indexOf(a, b), [1, 1, 1, 1, -1, 4, 5])
  t.end()
})

tape('empty', function (t) {
  var a = ['b', 'c', 'd', 'e', 'f']
  var b = []

  t.same(indexOf(a, b), [])
  t.end()
})

tape('empty source', function (t) {
  var a = []
  var b = ['b', 'c', 'd', 'e', 'f']

  t.same(indexOf(a, b), [-1, -1, -1, -1, -1])
  t.end()
})
