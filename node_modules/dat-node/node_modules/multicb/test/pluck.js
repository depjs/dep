'use strict'
var multicb = require('../')
var t = require('assert')

require('interleavings').test(function (isAsync) {

  function async(cb, delay, args) {
      isAsync(function() { cb.apply(null, args) })()
  }

  var done = multicb({ pluck: 1 })
  async(done(), 5, [null, 1])
  async(done(), 15, [null, 2])
  async(done(), 10, [null, 3])
  done(function(err, results) {
    console.log('done')
    t.equal(err, null)
    t.equal(results[0], 1)
    t.equal(results[1], 2)
    t.equal(results[2], 3)
    isAsync.done()
  })

})
