# connections

Keeps track of connections to an http or tcp server (or any other server object with the same api) and provides a way to close connections

By default, `require('http').createServer` provides no mechanism for tracking client connections and/or closing client connections

[![NPM](https://nodei.co/npm/connections.png)](https://nodei.co/npm/connections/)

## usage

```
var connections = require('connections')(serverInstance)
```

You can also pass an array of server instances

`connections` has `.sockets` and `.destroy`

### connections.on('idle', function() {})

called whenever all active connections have closed

### connections.on('close', function(socket) {})

called whenever a socket closes

### connections.on('connection', function (socket) {})

forwarded event from the server or servers

### connections.sockets

an array of open sockets (http clients)

### connections.destroy()

destroys/closes all active connections (calls .destroy() on each socket)

### connections.add(socket)

manually add a socket to the connection list

