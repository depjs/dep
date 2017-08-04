var hash = require('./crc16')

module.exports = LRU

function LRU (max, opts) {
  if (!(this instanceof LRU)) return new LRU(max, opts)
  if (!opts) opts = {}

  // how many collisions before evicting (factor of two for fast modulo)
  this.collisions = factorOfTwo(opts.collisions || opts.bucketSize || 4)
  // buckets should be a factor of two for fast modulo as well
  this.buckets = factorOf(max, this.collisions) / this.collisions

  // we use 16bit hashing to bucket index must be <0xffff
  while (this.buckets > 65536) {
    this.buckets >>= 1
    this.collisions <<= 1
  }

  this.size = this.buckets * this.collisions
  this.wrap = !opts.indexedValues
  this.cache = new Array(this.size)
  this.hash = this.buckets === 65536 ? hash : maskedHash(this.buckets - 1)
  this.evict = opts.evict || null
}

LRU.prototype.set = function (index, val) {
  var pageStart = this.collisions * this.hash(index)
  var pageEnd = pageStart + this.collisions
  var ptr = pageStart
  var page = null

  while (ptr < pageEnd) {
    page = this.cache[ptr]

    if (!page) {
      // no exiting version, but we have space to store it
      page = this.cache[ptr] = this.wrap ? new Node(index, val) : val
      move(this.cache, pageStart, ptr, page)
      return
    }

    if (page.index === index) {
      // update existing version and move to head of bucket
      if (this.wrap) page.value = val
      else this.cache[ptr] = val
      move(this.cache, pageStart, ptr, page)
      return
    }

    ptr++
  }

  // bucket is full, update oldest (last element in bucket)
  if (this.wrap) {
    if (this.evict) this.evict(page.index, page.value)
    page.index = index
    page.value = val
  } else {
    if (this.evict) this.evict(page.index, page)
    this.cache[ptr - 1] = val
  }
  move(this.cache, pageStart, ptr - 1, page)
}

LRU.prototype.get = function (index) {
  var pageStart = this.collisions * this.hash(index)
  var pageEnd = pageStart + this.collisions
  var ptr = pageStart

  while (ptr < pageEnd) {
    var page = this.cache[ptr++]

    if (!page) return null
    if (page.index !== index) continue

    // we found it! move to head of bucket and return value
    move(this.cache, pageStart, ptr - 1, page)

    return this.wrap ? page.value : page
  }

  return null
}

function move (list, index, itemIndex, item) {
  while (itemIndex > index) list[itemIndex] = list[--itemIndex]
  list[index] = item
}

function Node (index, value) {
  this.index = index
  this.value = value
}

function factorOf (n, factor) {
  n = factorOfTwo(n)
  while (n & (factor - 1)) n <<= 1
  return n
}

function factorOfTwo (n) {
  if (n && !(n & (n - 1))) return n
  var p = 1
  while (p < n) p <<= 1
  return p
}

function maskedHash (mask) {
  return function (n) {
    return hash(n) & mask
  }
}
