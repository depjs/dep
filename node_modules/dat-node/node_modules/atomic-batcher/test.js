var tape = require('tape')
var batcher = require('./')

tape('runs once', function (t) {
  var batch = batcher(run)

  batch('hello')

  function run (vals, cb) {
    t.same(vals, ['hello'])
    t.end()
    cb()
  }
})

tape('runs once with two vals', function (t) {
  var batch = batcher(run)

  batch(['hello', 'world'])

  function run (vals, cb) {
    t.same(vals, ['hello', 'world'])
    t.end()
    cb()
  }
})

tape('batches', function (t) {
  var batch = batcher(run)
  var expected = [['hello'], ['hej', 'hi', 'hey']]

  batch('hello')
  batch('hej')
  batch('hi')
  batch('hey', function () {
    t.end()
  })

  function run (vals, cb) {
    t.same(vals, expected.shift())
    process.nextTick(cb)
  }
})

tape('empty batch is called', function (t) {
  var batch = batcher(run)

  batch([])
  batch([], function () {
    t.end()
  })

  function run (vals, cb) {
    t.same(vals, [])
    process.nextTick(cb)
  }
})

tape('forwards error', function (t) {
  t.plan(4)

  var batch = batcher(run)
  var i = 0

  batch('hello', function (err) {
    t.same(err.message, '#0')
  })
  batch('hej', function (err) {
    t.same(err.message, '#1')
  })
  batch('hi', function (err) {
    t.same(err.message, '#1')
  })
  batch('hey', function (err) {
    t.same(err.message, '#1')
  })

  function run (vals, cb) {
    process.nextTick(function () {
      cb(new Error('#' + i++))
    })
  }
})
