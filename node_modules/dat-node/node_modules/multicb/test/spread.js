'use strict'
var multicb = require('../')
var t = require('assert')

require('interleavings').test(function (isAsync) {

  function async(cb, delay, args) {
      isAsync(function() { cb.apply(null, args) })()
  }

  var done = multicb({ pluck: 1, spread: true })
  async(done(), 5, [null, 1])
  async(done(), 15, [null, 2])
  async(done(), 10, [null, 3])
  done(function(err, first, second, third) {
    console.log('done')
    t.equal(err, null)
    t.equal(first, 1)
    t.equal(second, 2)
    t.equal(third, 3)
    isAsync.done()
  })

})
