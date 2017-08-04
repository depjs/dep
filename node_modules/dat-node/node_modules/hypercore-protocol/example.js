var protocol = require('./')

var a = protocol({id: 'a'})
var b = protocol({id: 'b'})

a.pipe(b).pipe(a)

var key = new Buffer('This is a 32 byte key, 012345678')
var missing = 5

var channel = a.feed(key)
var remoteChannel = b.feed(key)

a.on('end', function () {
  console.log('peer a ended')
})

b.on('end', function () {
  console.log('peer b ended')
})

channel.on('have', function (have) {
  console.log('channel.onhave()', have)

  for (var i = 0; i < 5; i++) {
    channel.request({
      index: i
    })
  }
})

channel.on('data', function (data) {
  console.log('channel.ondata()', data)

  if (!--missing) {
    channel.info({
      uploading: false,
      download: false
    })
  }
})

remoteChannel.on('request', function (request) {
  console.log('remoteChannel.onrequest()', request)
  remoteChannel.data({
    index: request.index,
    value: 'sup'
  })
})

remoteChannel.on('want', function (want) {
  console.log('remoteChannel.onwant()', want)
  remoteChannel.have({
    start: 0,
    length: 1000
  })
})

remoteChannel.on('info', function (info) {
  console.log('remoteChannel.oninfo', info)
  b.finalize()
})

channel.want({
  start: 0,
  length: 1000
})
