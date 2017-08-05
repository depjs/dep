var tape = require('tape')
var mutexify = require('./')

tape('locks', function(t) {
  t.plan(10)

  var lock = mutexify()
  var used = false

  for (var i = 0; i < 10; i++) {
    lock(function(release) {
      t.ok(!used, 'one at the time')
      used = true
      setImmediate(function() {
        used = false
        release()
      })
    })
  }
})

tape('calls callback', function(t) {
  var lock = mutexify()

  var cb = function(err, value) {
    t.same(err, null)
    t.same(value, 'hello world')
    t.end()
  }

  lock(function(release) {
    release(cb, null, 'hello world')
  })
})

tape('calls the locking callbacks in a different stack', function(t) {
  t.plan(2)

  var lock = mutexify()

  var topScopeFinished = false
  var secondScopeFinished = false

  lock(function(release) {
    t.ok(topScopeFinished, 'the test function has already finished running')
    release()
    secondScopeFinished = true
  })

  lock(function(release) {
    t.ok(secondScopeFinished, 'the last lock\'s call stack is done')
    release()
    t.end()
  })

  topScopeFinished = true
})
