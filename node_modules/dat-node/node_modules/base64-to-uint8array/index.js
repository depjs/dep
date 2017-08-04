module.exports = typeof atob === 'function' ? browser : node

function browser (s) {
  return new Uint8Array(atob(s).split('').map(charCodeAt))
}

function node (s) {
  var b = require('buf' + 'fer')
  return new b.Buffer(s, 'base64')
}

function charCodeAt (c) {
  return c.charCodeAt(0)
}
