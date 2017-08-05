var nextTick = require('process-nextick-args')

module.exports = RAM

function RAM (length, opts) {
  if (!(this instanceof RAM)) return new RAM(length, opts)

  if (Buffer.isBuffer(length)) {
    if (!opts) opts = {}
    opts.buffer = length
    length = opts.buffer.length
  }

  if (typeof length === 'object') {
    opts = length
    length = 0
  }

  if (!opts) opts = {}
  if (typeof length !== 'number') length = 0

  this.pageSize = length || opts.pageSize || 1024 * 1024
  this.length = length || 0
  this.buffers = []

  if (opts.buffer) this.buffers.push(opts.buffer)
}

RAM.prototype.open = function (cb) {
  if (cb) nextTick(cb)
}

RAM.prototype.write = function (offset, data, cb) {
  if (offset + data.length > this.length) this.length = data.length + offset

  var i = Math.floor(offset / this.pageSize)
  var rel = offset - (i * this.pageSize)

  while (data.length) {
    var next = (rel + data.length) > this.pageSize ? data.slice(0, this.pageSize - rel) : data
    var buf = this.buffers[i]

    if (!buf) {
      buf = rel === 0 && next.length === this.pageSize ? next : calloc(this.pageSize)
      this.buffers[i] = buf
    }

    if (buf !== next) next.copy(buf, rel)
    if (next === data) break

    i++
    rel = 0
    data = data.slice(next.length)
  }

  if (cb) nextTick(cb)
}

RAM.prototype.read = function (offset, length, cb) {
  if (offset + length > this.length) return nextTick(cb, new Error('Could not satisfy length'))

  var data = new Buffer(length)
  var ptr = 0
  var i = Math.floor(offset / this.pageSize)
  var rel = offset - (i * this.pageSize)

  while (ptr < data.length) {
    var buf = this.buffers[i]
    var len = this.pageSize - rel

    if (!buf) data.fill(0, ptr, Math.min(data.length, ptr + len))
    else buf.copy(data, ptr, rel)

    ptr += len
    i++
    rel = 0
  }

  nextTick(cb, null, data)
}

RAM.prototype.del = function (offset, length, cb) {
  var overflow = offset % this.pageSize
  var inc = overflow && this.pageSize - overflow

  if (inc < length) {
    offset += inc
    length -= overflow

    var end = offset + length
    var i = offset / this.pageSize

    while (offset + this.pageSize <= end && i < this.buffers.length) {
      this.buffers[i++] = undefined
      offset += this.pageSize
    }
  }

  if (cb) nextTick(cb)
}

RAM.prototype.close = function (cb) {
  if (cb) nextTick(cb)
}

RAM.prototype.destroy = function (cb) {
  this.buffers = []
  if (cb) nextTick(cb)
}

RAM.prototype.toBuffer = function () {
  var buf = this.buffers.length === 1 ? this.buffers[0] : Buffer.concat(this.buffers)
  return buf.length === this.length ? buf : buf.slice(0, this.length)
}

function calloc (len) {
  if (Buffer.alloc) return Buffer.alloc(len)
  var buf = new Buffer(len)
  buf.fill(0)
  return buf
}
