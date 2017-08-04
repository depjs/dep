var req = require('request')

module.exports = Nets

function Nets (opts, cb) {
  if (typeof opts === 'string') opts = { uri: opts }

  // in node, if encoding === null then response will be a Buffer. we want this to be the default
  if (!opts.hasOwnProperty('encoding')) opts.encoding = null

  // in browser, we should by default convert the arraybuffer into a Buffer
  if (process.browser && !opts.hasOwnProperty('json') && opts.encoding === null) {
    opts.responseType = 'arraybuffer'
    var originalCb = cb
    cb = bufferify
  }

  function bufferify (err, resp, body) {
    if (body) body = new Buffer(new Uint8Array(body))
    originalCb(err, resp, body)
  }

  return req(opts, cb)
}
