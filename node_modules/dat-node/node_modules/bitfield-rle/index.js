var varint = require('varint')

exports.encode = encode
exports.encode.bytes = 0
exports.encodingLength = encodingLength

exports.decode = decode
exports.decode.bytes = 0
exports.decodingLength = decodingLength

function State (input, output, offset) {
  this.inputOffset = 0
  this.inputLength = input.length
  this.input = input
  this.outputOffset = offset
  this.output = output
}

function encode (bitfield, buffer, offset) {
  if (!offset) offset = 0
  if (!buffer) buffer = new Buffer(encodingLength(bitfield))
  var state = new State(bitfield, buffer, offset)
  rle(state)
  encode.bytes = state.outputOffset - offset
  return buffer
}

function encodingLength (bitfield) {
  var state = new State(bitfield, null, 0)
  rle(state)
  return state.outputOffset
}

function decode (buffer, offset) {
  if (!offset) offset = 0

  var bitfield = new Buffer(decodingLength(buffer, offset))
  var ptr = 0

  while (offset < buffer.length) {
    var next = varint.decode(buffer, offset)
    var repeat = next & 1
    var len = repeat ? (next - (next & 3)) / 4 : next / 2

    offset += varint.decode.bytes

    if (repeat) {
      bitfield.fill(next & 2 ? 255 : 0, ptr, ptr + len)
    } else {
      buffer.copy(bitfield, ptr, offset, offset + len)
      offset += len
    }

    ptr += len
  }

  decode.bytes = buffer.length - offset

  return bitfield
}

function decodingLength (buffer, offset) {
  if (!offset) offset = 0

  var len = 0

  while (offset < buffer.length) {
    var next = varint.decode(buffer, offset)
    offset += varint.decode.bytes

    var repeat = next & 1
    var slice = repeat ? (next - (next & 3)) / 4 : next / 2

    len += slice
    if (!repeat) offset += slice
  }

  if (offset > buffer.length) throw new Error('Invalid RLE bitfield')

  return len
}

function rle (state) {
  var len = 0
  var bits = 0
  var input = state.input

  while (state.inputLength > 0 && !input[state.inputLength - 1]) state.inputLength--

  for (var i = 0; i < state.inputLength; i++) {
    if (input[i] === bits) {
      len++
      continue
    }

    if (len) encodeUpdate(state, i, len, bits)

    if (input[i] === 0 || input[i] === 255) {
      bits = input[i]
      len = 1
    } else {
      len = 0
    }
  }

  if (len) encodeUpdate(state, state.inputLength, len, bits)
  encodeFinal(state)
}

function encodeHead (state, end) {
  var headLength = end - state.inputOffset
  varint.encode(2 * headLength, state.output, state.outputOffset)
  state.outputOffset += varint.encode.bytes
  state.input.copy(state.output, state.outputOffset, state.inputOffset, end)
  state.outputOffset += headLength
}

function encodeFinal (state) {
  var headLength = state.inputLength - state.inputOffset
  if (!headLength) return

  if (!state.output) {
    state.outputOffset += (headLength + varint.encodingLength(2 * headLength))
  } else {
    encodeHead(state, state.inputLength)
  }

  state.inputOffset = state.inputLength
}

function encodeUpdate (state, i, len, bit) {
  var headLength = i - len - state.inputOffset
  var headCost = (headLength ? varint.encodingLength(2 * headLength) + headLength : 0)
  var enc = 4 * len + (bit ? 2 : 0) + 1 // len << 2 | bit << 1 | 1
  var encCost = headCost + varint.encodingLength(enc)
  var baseCost = varint.encodingLength(2 * (i - state.inputOffset)) + i - state.inputOffset

  if (encCost >= baseCost) return

  if (!state.output) {
    state.outputOffset += encCost
    state.inputOffset = i
    return
  }

  if (headLength) encodeHead(state, i - len)

  varint.encode(enc, state.output, state.outputOffset)
  state.outputOffset += varint.encode.bytes
  state.inputOffset = i
}
