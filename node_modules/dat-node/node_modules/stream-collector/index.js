var once = require('once')

module.exports = function(stream, cb) {
  if (!cb) return stream

  var list = []

  cb = once(cb)

  stream.on('data', function(data) {
    list.push(data)
  })

  stream.on('end', function() {
    cb(null, list)
  })

  stream.on('close', function() {
    cb(new Error('Premature close'))
  })

  stream.on('error', cb)

  return stream
}