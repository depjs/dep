module.exports = codecs

codecs.ascii = createString('ascii')
codecs.utf8 = createString('utf-8')
codecs.hex = createString('hex')
codecs.base64 = createString('base64')
codecs.ucs2 = createString('ucs2')
codecs.utf16le = createString('utf16le')
codecs.ndjson = createJSON(true)
codecs.json = createJSON(false)
codecs.binary = {
  encode: function encodeBinary (obj) {
    return typeof obj === 'string' ? new Buffer(obj, 'utf-8') : obj
  },
  decode: function decodeBinary (buf) {
    return buf
  }
}

function codecs (fmt) {
  if (typeof fmt === 'object' && fmt && fmt.encode && fmt.decode) return fmt

  switch (fmt) {
    case 'ndjson': return codecs.ndjson
    case 'json': return codecs.json
    case 'ascii': return codecs.ascii
    case 'utf-8':
    case 'utf8': return codecs.utf8
    case 'hex': return codecs.hex
    case 'base64': return codecs.base64
    case 'ucs-2':
    case 'ucs2': return codecs.ucs2
    case 'utf16-le':
    case 'utf16le': return codecs.utf16le
  }

  return codecs.binary
}

function createJSON (newline) {
  return {
    encode: newline ? encodeNDJSON : encodeJSON,
    decode: function decodeJSON (buf) {
      return JSON.parse(buf.toString())
    }
  }

  function encodeJSON (val) {
    return new Buffer(JSON.stringify(val))
  }

  function encodeNDJSON (val) {
    return new Buffer(JSON.stringify(val) + '\n')
  }
}

function createString (type) {
  return {
    encode: function encodeString (val) {
      if (typeof val !== 'string') val = val.toString()
      return new Buffer(val, type)
    },
    decode: function decodeString (buf) {
      return buf.toString(type)
    }
  }
}
