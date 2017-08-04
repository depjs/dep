var tape = require('tape')
var utp = require('../index.js')

tape('server + connect', function (t) {
  var connected = false

  var server = utp.createServer(function (socket) {
    connected = true
    socket.write('hello mike')
  })

  server.listen(function () {
    var socket = utp.connect(server.address().port)

    socket.on('connect', function () {
      socket.destroy()
      server.close()
      t.ok(connected, 'connected successfully')
      t.end()
    })

    socket.write('hello joe')
  })
})

tape('server + connect with resolve', function (t) {
  var connected = false

  var server = utp.createServer(function (socket) {
    connected = true
    socket.write('hello mike')
  })

  server.listen(function () {
    var socket = utp.connect(server.address().port, 'localhost')

    socket.on('connect', function () {
      socket.destroy()
      server.close()
      t.ok(connected, 'connected successfully')
      t.end()
    })

    socket.write('hello joe')
  })
})

tape('bad resolve', function (t) {
  t.plan(2)

  var socket = utp.connect(10000, 'domain.does-not-exist')

  socket.on('connect', function () {
    t.fail('should not connect')
  })

  socket.on('error', function () {
    t.pass('errored')
  })

  socket.on('close', function () {
    t.pass('closed')
    t.end()
  })
})

tape('server immediate close', function (t) {
  var server = utp.createServer(function (socket) {
    socket.write('hi')
    socket.end()
    server.close(function () {
      t.pass('closed')
      t.end()
    })
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)

    socket.write('hi')
    socket.once('connect', function () {
      socket.end()
    })

    socket.on('close', function () {
    })
  })
})

tape.skip('only server sends', function (t) {
  // this is skipped because it doesn't work.
  // utpcat has the same issue so this seems to be a bug
  // in libutp it self
  // in practice this is less of a problem as most protocols
  // exchange a handshake message. would be great to get fixed though
  var server = utp.createServer(function (socket) {
    socket.write('hi')
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)

    socket.on('data', function (data) {
      t.same(data, Buffer('hi'))
      socket.destroy()
      server.close()
    })
  })
})

tape('server listens on a port in use', function (t) {
  if (Number(process.versions.node.split('.')[0]) === 0) {
    t.pass('skipping since node 0.10 forces SO_REUSEADDR')
    t.end()
    return
  }

  var server = utp.createServer()
  server.listen(0, function () {
    var server2 = utp.createServer()
    server2.listen(server.address().port, function () {
      t.fail('should not be listening')
    })
    server2.on('error', function () {
      server.close()
      server2.close()
      t.pass('had error')
      t.end()
    })
  })
})

tape('echo server', function (t) {
  var server = utp.createServer(function (socket) {
    socket.pipe(socket)
    socket.on('data', function (data) {
      t.same(data, Buffer('hello'))
    })
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)

    socket.write('hello')
    socket.on('data', function (data) {
      socket.destroy()
      server.close()
      t.same(data, Buffer('hello'))
      t.end()
    })
  })
})

tape('echo server back and fourth', function (t) {
  var echoed = 0
  var server = utp.createServer(function (socket) {
    socket.pipe(socket)
    socket.on('data', function (data) {
      echoed++
      t.same(data, Buffer('hello'))
    })
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)
    var rounds = 10

    socket.write('hello')
    socket.on('data', function (data) {
      if (--rounds) return socket.write(data)
      socket.destroy()
      server.close()
      t.same(echoed, 10)
      t.same(Buffer(data), data)
      t.end()
    })
  })
})

tape('echo big message', function (t) {
  var big = Buffer(4 * 1024 * 1024)
  big.fill('yolo')
  var server = utp.createServer(function (socket) {
    socket.pipe(socket)
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)
    var buffer = Buffer(big.length)
    var ptr = 0

    socket.write(big)
    socket.on('data', function (data) {
      data.copy(buffer, ptr)
      ptr += data.length
      if (big.length === ptr) {
        socket.destroy()
        server.close()
        t.same(buffer, big)
        t.end()
      }
    })
  })
})

tape('two connections', function (t) {
  var count = 0
  var gotA = false
  var gotB = false

  var server = utp.createServer(function (socket) {
    count++
    socket.pipe(socket)
  })

  server.listen(0, function () {
    var socket1 = utp.connect(server.address().port)
    var socket2 = utp.connect(server.address().port)

    socket1.write('a')
    socket2.write('b')

    socket1.on('data', function (data) {
      gotA = true
      t.same(data, Buffer('a'))
      if (gotB) done()
    })

    socket2.on('data', function (data) {
      gotB = true
      t.same(data, Buffer('b'))
      if (gotA) done()
    })

    function done () {
      socket1.destroy()
      socket2.destroy()
      server.close()
      t.ok(gotA)
      t.ok(gotB)
      t.same(count, 2)
      t.end()
    }
  })
})

tape('emits close', function (t) {
  var serverClosed = false
  var clientClosed = false

  var server = utp.createServer(function (socket) {
    socket.on('close', function () {
      serverClosed = true
      if (clientClosed) done()
    })
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)
    socket.write('hi')
    socket.end() // utp does not support half open
    socket.on('close', function () {
      clientClosed = true
      if (serverClosed) done()
    })
  })

  function done () {
    server.close()
    t.ok(serverClosed)
    t.ok(clientClosed)
    t.end()
  }
})

tape('flushes', function (t) {
  var sent = ''
  var server = utp.createServer(function (socket) {
    var buf = ''
    socket.setEncoding('utf-8')
    socket.on('data', function (data) {
      buf += data
    })
    socket.on('end', function () {
      server.close()
      t.same(buf, sent)
      t.end()
    })
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)
    for (var i = 0; i < 50; i++) {
      socket.write(i + '\n')
      sent += i + '\n'
    }
    socket.end()
  })
})

tape('close waits for connections to close', function (t) {
  var sent = ''
  var server = utp.createServer(function (socket) {
    var buf = ''
    socket.setEncoding('utf-8')
    socket.on('data', function (data) {
      buf += data
    })
    socket.on('end', function () {
      t.same(buf, sent)
      t.end()
    })
    server.close()
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)
    for (var i = 0; i < 50; i++) {
      socket.write(i + '\n')
      sent += i + '\n'
    }
    socket.end()
  })
})

tape('timeout', function (t) {
  var serverClosed = false
  var clientClosed = false
  var missing = 2

  var server = utp.createServer(function (socket) {
    socket.setTimeout(100, socket.destroy)
    socket.write('hi')
    socket.on('close', function () {
      serverClosed = true
      done()
    })
  })

  server.listen(0, function () {
    var socket = utp.connect(server.address().port)
    socket.write('hi')
    socket.on('close', function () {
      clientClosed = true
      done()
    })
  })

  function done () {
    if (--missing) return
    server.close()
    t.ok(clientClosed)
    t.ok(serverClosed)
    t.end()
  }
})
