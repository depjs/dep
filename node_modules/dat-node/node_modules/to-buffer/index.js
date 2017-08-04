module.exports = toBuffer

function toBuffer (buf, enc) {
  if (Buffer.isBuffer(buf)) return buf
  if (typeof buf === 'string') return new Buffer(buf, enc)
  if (Array.isArray(buf)) return new Buffer(buf)
  throw new Error('Input should be a buffer or a string')
}
