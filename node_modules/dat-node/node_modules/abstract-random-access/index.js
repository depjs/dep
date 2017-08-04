var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

var noop = function () {}

module.exports = Abstract
inherits(Abstract, EventEmitter)

function Abstract (opts) {
  if (!(this instanceof Abstract)) return new Abstract(opts)
  EventEmitter.call(this)

  this.opened = false
  this._opening = null
  this._closing = null

  if (opts) {
    if (opts.read) this._read = opts.read
    if (opts.write) this._write = opts.write
    if (opts.open) this._open = opts.open
    if (opts.close) this._close = opts.close
    if (opts.end) this._end = opts.end
    if (opts.unlink) this._unlink = opts.unlink
  }
}

Abstract.prototype.open = function (callback) {
  if (!callback) callback = noop
  if (this.opened) return process.nextTick(callback)

  var self = this

  if (this._opening) {
    this._opening.push(callback)
  } else {
    this._opening = [callback]
    this._open(opened)
  }

  function opened (err) {
    if (!err) self.opened = true
    var cbs = self._opening
    self._opening = null
    self.emit('open')
    for (var i = 0; i < cbs.length; i++) cbs[i](err)
  }
}

Abstract.prototype._open = function (callback) {
  process.nextTick(callback)
}

Abstract.prototype.write = function (offset, buffer, callback) {
  if (!callback) callback = noop

  if (typeof offset !== 'number') throw new Error('Scalar offset')
  if (!Buffer.isBuffer(buffer)) throw new Error('Buffer')

  if (!this.opened) return openAndWrite(this, offset, buffer, callback)
  this._write(offset, buffer, callback)
}

Abstract.prototype._write = function (offset, buffer, callback) {
  process.nextTick(function () {
    callback(new Error('Write not implemented'))
  })
}

Abstract.prototype.read = function (offset, length, callback) {
  if (typeof offset !== 'number') throw new Error('Scalar offset')
  if (typeof length !== 'number') throw new Error('Scalar length')
  if (typeof callback !== 'function') throw new Error('Callback')

  if (!this.opened) return openAndRead(this, offset, length, callback)
  this._read(offset, length, callback)
}

Abstract.prototype._read = function (offset, length, callback) {
  process.nextTick(function () {
    callback(new Error('Read not implemented'))
  })
}

Abstract.prototype.close = function (callback) {
  if (!callback) callback = noop

  var self = this

  if (!this.opened) this.open(next)
  else next()

  function next (err) {
    if (err) return callback(err)

    if (self._closing) {
      self._closing.push(callback)
    } else {
      self._closing = [callback]
      self._close(closed)
    }
  }

  function closed (err) {
    if (!err) self.opened = false
    var cbs = self._closing
    self._closing = null
    self.emit('close')
    for (var i = 0; i < cbs.length; i++) cbs[i](err)
  }
}

Abstract.prototype._close = function (callback) {
  process.nextTick(callback)
}

Abstract.prototype.end = function (options, callback) {
  if (typeof options === 'function') return this.end(null, options)
  if (!callback) callback = noop

  var self = this

  if (!this.opened) this.open(next)
  else next()

  function next (err) {
    if (err) return callback(err)
    self._end(options, callback)
  }
}

Abstract.prototype._end = function (options, callback) {
  process.nextTick(callback)
}

Abstract.prototype.unlink = function (callback) {
  if (!callback) callback = noop

  var self = this

  if (!this.opened) this.open(next)
  else next()

  function next (err) {
    if (err) return callback(err)
    self._unlink(callback)
  }
}

Abstract.prototype._unlink = function (callback) {
  process.nextTick(callback)
}

function openAndWrite (self, offset, buffer, callback) {
  self.open(function (err) {
    if (err) return callback(err)
    self.write(offset, buffer, callback)
  })
}

function openAndRead (self, offset, length, callback) {
  self.open(function (err) {
    if (err) return callback(err)
    self.read(offset, length, callback)
  })
}
