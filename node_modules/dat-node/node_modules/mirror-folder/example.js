var mirror = require('./')
var p = mirror('.', '/tmp/mirror', {live: true, dereference: true})

p.on('put', function (src, dst) {
  console.log('adding', dst.name)
})

p.on('del', function (dst) {
  console.log('deleting', dst.name)
})
