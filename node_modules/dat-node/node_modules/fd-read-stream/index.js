var stream = require('readable-stream')
var fs = require('fs')
var util = require('util')

module.exports = ReadStream

function ReadStream (fd, opts) {
  if (!(this instanceof ReadStream)) return new ReadStream(fd, opts)
  if (!opts) opts = {}

  stream.Readable.call(this, {highWaterMark: opts.highWaterMark || 65536})

  this.fd = fd
  this.bytesRead = 0
  this.destroyed = false

  this._retry = opts.retry || 0
  this._lastSuccess = true
  this._tail = !!opts.tail
  this._timeout = null

  var self = this

  this._callback = onread
  this._reread = reread

  function onread (err, bytes, buf) {
    self._onread(err, bytes, buf)
  }

  function reread () {
    self._read(65536)
  }
}

util.inherits(ReadStream, stream.Readable)

ReadStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true

  var self = this

  fs.close(this.fd, function (closeErr) {
    if (closeErr) err = closeErr
    if (err) self.emit('error', err)
    self.emit('close')
  })
}

ReadStream.prototype._read = function (size) {
  if (this.destroyed) return
  var buf = new Buffer(size)
  fs.read(this.fd, buf, 0, buf.length, this.bytesRead, this._callback)
}

ReadStream.prototype._onread = function (err, bytes, buf) {
  if (this._retry && err && this._lastSuccess) {
    err = null
    bytes = 0
  }

  if (err) return this.destroy(err)

  var lastSuccess = this._lastSuccess

  this.bytesRead += bytes
  this._lastSuccess = bytes > 0

  if (bytes) {
    this.push(buf.slice(0, bytes))
    return
  }

  if ((this._retry && lastSuccess) || this._tail) {
    this._timeout = setTimeout(this._reread, this._retry || 100)
    return
  }

  this.push(null)
  this.destroy()
}
