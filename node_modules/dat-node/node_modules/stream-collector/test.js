var collect = require('./')
var tape = require('tape')
var through = require('through2')

var stream = function() {
  var s = through.obj()
  s.write('a')
  s.write('b')
  s.write('c')
  s.end()
  return s
}

tape('buffers', function(t) {
  collect(stream(), function(err, list) {
    t.same(list, ['a', 'b', 'c'], 'buffered output')
    t.end()
  })
})

tape('errors on error', function(t) {
  var s = through()
  collect(s, function(err) {
    t.same(err.message, 'stop', 'had error')
    t.end()
  })
  s.destroy(new Error('stop'))
})

tape('errors on premature close', function(t) {
  var s = through()
  collect(s, function(err) {
    t.ok(err, 'had error')
    t.end()
  })
  s.destroy()
})

tape('no buffering on no cb', function(t) {
  var s = collect(stream())

  setTimeout(function() {
    var list = ['a', 'b', 'c']
    s.on('data', function(data) {
      t.same(data, list.shift(), 'streaming output matches')
    })
    s.on('end', function() {
      t.same(list.length, 0, 'no more data')
      t.end()
    })
  }, 250)
})
