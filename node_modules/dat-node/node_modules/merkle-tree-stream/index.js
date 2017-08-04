var stream = require('readable-stream')
var util = require('util')
var generator = require('./generator')

module.exports = MerkleTree

function MerkleTree (opts, roots) {
  if (!(this instanceof MerkleTree)) return new MerkleTree(opts, roots)
  if (!opts) opts = {}
  this._generator = generator(opts, roots)
  this.destroyed = false
  this.roots = this._generator.roots
  this.blocks = 0
  var hwm = opts.highWaterMark || 16
  stream.Transform.call(this, {objectMode: true, highWaterMark: hwm})
}

util.inherits(MerkleTree, stream.Transform)

MerkleTree.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  if (err) this.emit('error', err)
  this.emit('close')
}

MerkleTree.prototype._transform = function (data, enc, cb) {
  var nodes = this._generator.next(data)
  for (var i = 0; i < nodes.length; i++) this.push(nodes[i])
  this.blocks = this._generator.blocks
  cb()
}
