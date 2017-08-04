var test = require('tape')
var swarm = require('discovery-swarm')
var swarmConfig = require('.')

test('two swarms connect and exchange data with defaults', function (t) {
  var config = swarmConfig() // no opts
  var a = swarm(config)
  var b = swarm(config)

  a.on('connection', function (connection) {
    connection.write('hello')
    connection.on('data', function (data) {
      a.destroy()
      b.destroy()
      t.same(data, Buffer('hello'))
      t.end()
    })
  })

  b.on('connection', function (connection) {
    connection.pipe(connection)
  })

  a.join('test')
  b.join('test')
})
