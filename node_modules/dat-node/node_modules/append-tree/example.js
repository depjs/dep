var tree = require('append-tree')
var hypercore = require('hypercore')
var ram = require('random-access-memory')

var feed = hypercore(ram)
var tr = tree(feed, {valueEncoding: 'utf-8'})

tr.put('/hello', 'world', function (err) {
  if (err) throw err

  tr.get('/hello', function (err, val) {
    if (err) throw err
    console.log(val) // <-- 'world'

    tr.list('/', function (err, list) {
      if (err) throw err
      console.log(list) // <-- ['hello']
    })
  })
})
