var batcher = require('atomic-batcher')
var db = require('level')('some.db')

var batch = batcher(function work (ops, cb) {
  // only one batch will happen at the time
  console.log('Batching:', ops, '\n')
  db.batch(ops, cb)
})

batch({type: 'put', key: 'hello', value: 'world-1'})
batch({type: 'put', key: 'hello', value: 'world-2'})
batch({type: 'put', key: 'hello', value: 'world-3'})
batch({type: 'put', key: 'hi', value: 'hello'}, function () {
  console.log('Printing latest values:\n')
  db.get('hello', console.log) // returns world-3
  db.get('hi', console.log) // returns hello
})
