'use strict'
var multicb = require('../')
var t = require('assert')

var done = multicb()
var cbs = [done(), done()]
var called = 0
done(function(err, results) {
  called++
  t.equal(results, void 0)
})
cbs[0]('fail')
cbs[1]('fail')
t.equal(called, 1)
