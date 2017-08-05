var events = require('events')

module.exports = function (servers) {
  var sockets = []

  if (!Array.isArray(servers)) servers = [servers]

  for (var i = 0; i < servers.length; i++) {
    servers[i].on('connection', add)
  }

  var obj = new events.EventEmitter()
  obj.sockets = sockets
  obj.destroy = destroy
  obj.add = add

  return obj

  function add (socket) {
    sockets.push(socket)
    socket.on('close', onclose)
    obj.emit('connection', socket)
  }

  function onclose () {
    sockets.splice(sockets.indexOf(this), 1)
    obj.emit('close', this)
    if (sockets.length === 0) obj.emit('idle')
  }

  function destroy () {
    for (var i = 0; i < sockets.length; i++) {
      sockets[i].destroy()
    }
  }
}
