var utp = require('./')

var server = utp.createServer(function (socket) {
  console.log('Server received socket')
  socket.pipe(socket)
})

server.listen(9000, function () {
  console.log('Server is listening on port %d', server.address().port)

  var socket = utp.connect(9000)

  socket.write('hello world')
  socket.on('data', function (data) {
    console.log('echo:', data.toString())
  })
})
