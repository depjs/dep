// a more low level interface to the merkle tree stream.
// useful for certain applications the require non-streamy access to the algos.
// versioned by the same semver as the stream interface.

var flat = require('flat-tree')

module.exports = MerkleGenerator

function MerkleGenerator (opts, roots) {
  if (!(this instanceof MerkleGenerator)) return new MerkleGenerator(opts, roots)
  if (!opts || !opts.leaf || !opts.parent) throw new Error('opts.leaf and opts.parent required')

  this.roots = roots || opts.roots || []
  this.blocks = this.roots.length ? 1 + flat.rightSpan(this.roots[this.roots.length - 1].index) / 2 : 0

  for (var i = 0; i < this.roots.length; i++) {
    var r = this.roots[i]
    if (r && !r.parent) r.parent = flat.parent(r.index)
  }

  this._leaf = opts.leaf
  this._parent = opts.parent
}

MerkleGenerator.prototype.next = function (data, nodes) {
  if (!Buffer.isBuffer(data)) data = new Buffer(data)
  if (!nodes) nodes = []

  var index = 2 * this.blocks++

  var leaf = {
    index: index,
    parent: flat.parent(index),
    hash: null,
    size: data.length,
    data: data
  }

  leaf.hash = this._leaf(leaf, this.roots)
  this.roots.push(leaf)
  nodes.push(leaf)

  while (this.roots.length > 1) {
    var left = this.roots[this.roots.length - 2]
    var right = this.roots[this.roots.length - 1]

    if (left.parent !== right.parent) break

    this.roots.pop()
    this.roots[this.roots.length - 1] = leaf = {
      index: left.parent,
      parent: flat.parent(left.parent),
      hash: this._parent(left, right),
      size: left.size + right.size,
      data: null
    }
    nodes.push(leaf)
  }

  return nodes
}
