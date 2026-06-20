import { Writable } from 'stream'

// Streaming tar (USTAR / PAX / GNU long name) parser. A Writable that the
// (gunzipped) tarball is piped into; for each entry it calls
//   onEntry(header, content, done)
// where `content` is the full entry body buffered in memory (npm package
// entries are small) and `done` resumes parsing. Supports synchronous and
// asynchronous `done` without recursing per entry.

const BLOCK = 512

const readStr = (buf, off, len) =>
  buf.toString('utf8', off, off + len).replace(/\0.*$/, '')

const readOctal = (buf, off, len) => {
  const s = readStr(buf, off, len).trim()
  return s ? parseInt(s, 8) || 0 : 0
}

const isZero = (block) => {
  for (let i = 0; i < block.length; i++) {
    if (block[i] !== 0) return false
  }
  return true
}

const parseHeader = (block) => {
  if (isZero(block)) return null
  const name = readStr(block, 0, 100)
  const prefix = readStr(block, 345, 155)
  return {
    name: prefix ? prefix + '/' + name : name,
    mode: readOctal(block, 100, 8),
    size: readOctal(block, 124, 12),
    type: String.fromCharCode(block[156] || 0),
    linkname: readStr(block, 157, 100)
  }
}

const parsePax = (buf) => {
  const res = {}
  const s = buf.toString('utf8')
  let i = 0
  while (i < s.length) {
    const sp = s.indexOf(' ', i)
    if (sp === -1) break
    const len = parseInt(s.slice(i, sp), 10)
    if (!len) break
    const record = s.slice(sp + 1, i + len - 1)
    const eq = record.indexOf('=')
    if (eq !== -1) res[record.slice(0, eq)] = record.slice(eq + 1)
    i += len
  }
  return res
}

export default class TarParser extends Writable {
  constructor (onEntry) {
    super()
    this.onEntry = onEntry
    this.buf = Buffer.alloc(0)
    this.paused = false
    this.pumping = false
    this.ended = false
    this.writeCb = null
    this.pax = null
    this.longName = null
    this.longLink = null
  }

  _write (chunk, enc, cb) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk
    this.writeCb = cb
    this._pump()
  }

  _resume () {
    this.paused = false
    if (!this.pumping) this._pump()
  }

  _pump () {
    if (this.pumping) return
    this.pumping = true
    while (!this.paused && !this.ended && this.buf.length >= BLOCK) {
      const header = parseHeader(this.buf.subarray(0, BLOCK))
      if (header === null) { this.ended = true; break }
      const padded = Math.ceil(header.size / BLOCK) * BLOCK
      if (this.buf.length < BLOCK + padded) break
      const content = Buffer.from(this.buf.subarray(BLOCK, BLOCK + header.size))
      this.buf = this.buf.subarray(BLOCK + padded)
      this._handle(header, content)
    }
    this.pumping = false
    if (this.writeCb && !this.paused) {
      const cb = this.writeCb
      this.writeCb = null
      cb()
    }
  }

  _handle (header, content) {
    if (header.type === 'x' || header.type === 'g') {
      this.pax = Object.assign(this.pax || {}, parsePax(content))
      return
    }
    if (header.type === 'L') {
      this.longName = content.toString('utf8').replace(/\0.*$/, '')
      return
    }
    if (header.type === 'K') {
      this.longLink = content.toString('utf8').replace(/\0.*$/, '')
      return
    }
    if (this.longName) { header.name = this.longName; this.longName = null }
    if (this.longLink) { header.linkname = this.longLink; this.longLink = null }
    if (this.pax) {
      if (this.pax.path) header.name = this.pax.path
      if (this.pax.linkpath) header.linkname = this.pax.linkpath
      if (this.pax.size) header.size = parseInt(this.pax.size, 10)
      this.pax = null
    }
    this.paused = true
    this.onEntry(header, content, () => this._resume())
  }

  _final (cb) {
    cb()
  }
}
