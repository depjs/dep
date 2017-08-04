var tape = require('tape')
var dgram = require('dgram')
var utp = require('../')

tape('dgram-like socket', function (t) {
  var socket = utp()

  socket.on('message', function (buf, rinfo) {
    t.same(rinfo.port, socket.address().port)
    t.same(rinfo.address, '127.0.0.1')
    t.same(buf, Buffer('hello'))
    socket.close()
    t.end()
  })

  socket.bind(function () {
    socket.send(Buffer('hello'), 0, 5, socket.address().port, '127.0.0.1')
  })
})

tape('double close', function (t) {
  var socket = utp()

  socket.on('close', function () {
    socket.close(function () {
      t.pass('closed twice')
      t.end()
    })
  })

  socket.bind(0, function () {
    socket.close()
  })
})

tape('echo socket', function (t) {
  var socket = utp()

  socket.on('message', function (buf, rinfo) {
    socket.send(buf, 0, buf.length, rinfo.port, rinfo.address)
  })

  socket.bind(function () {
    var other = dgram.createSocket('udp4')
    other.on('message', function (buf, rinfo) {
      t.same(rinfo.port, socket.address().port)
      t.same(rinfo.address, '127.0.0.1')
      t.same(buf, Buffer('hello'))
      socket.close()
      other.close()
      t.end()
    })
    other.send(Buffer('hello'), 0, 5, socket.address().port, '127.0.0.1')
  })
})

tape('echo socket with resolve', function (t) {
  var socket = utp()

  socket.on('message', function (buf, rinfo) {
    socket.send(buf, 0, buf.length, rinfo.port, 'localhost')
  })

  socket.bind(function () {
    var other = dgram.createSocket('udp4')
    other.on('message', function (buf, rinfo) {
      t.same(rinfo.port, socket.address().port)
      t.same(rinfo.address, '127.0.0.1')
      t.same(buf, Buffer('hello'))
      socket.close()
      other.close()
      t.end()
    })
    other.send(Buffer('hello'), 0, 5, socket.address().port, '127.0.0.1')
  })
})

tape('combine server and connection', function (t) {
  var socket = utp()
  var gotClient = false

  socket.on('connection', function (client) {
    gotClient = true
    client.pipe(client)
  })

  socket.listen(function () {
    var client = socket.connect(socket.address().port)
    client.write('hi')
    client.on('data', function (data) {
      socket.close()
      client.destroy()
      t.same(data, Buffer('hi'))
      t.ok(gotClient)
      t.end()
    })
  })
})

tape('both ends write first', function (t) {
  var missing = 2
  var socket = utp()

  socket.on('connection', function (connection) {
    connection.write('a')
    connection.on('data', function (data) {
      t.same(data, Buffer('b'))
      done()
    })
  })

  socket.listen(0, function () {
    var connection = socket.connect(socket.address().port)
    connection.write('b')
    connection.on('data', function (data) {
      t.same(data, Buffer('a'))
      connection.end()
      done()
    })
  })

  function done () {
    if (--missing) return
    socket.close()
    t.end()
  }
})
