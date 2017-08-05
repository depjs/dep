var assert = require('assert')
var url = require('url')
var stringKey = require('dat-encoding').toStr
var nets = require('nets')
var datDns = require('dat-dns')()
var debug = require('debug')('dat-link-resolve')

module.exports = resolve

function resolve (link, cb) {
  assert.ok(link, 'dat-link-resolve: link required')
  assert.equal(typeof cb, 'function', 'dat-link-resolve: callback required')

  var key = null

  try {
    // validates + removes dat://
    // also works for http urls with keys in them
    key = stringKey(link)
    cb(null, key)
  } catch (e) {
    return lookup()
  }

  function lookup () {
    debug('lookup', link)
    var parsed = url.parse(link)

    // parsed.host check b/c url.parse('beakerbrowser.com') returns parsed.pathname = 'beakerbrowser.com'
    if (parsed.host && parsed.path && parsed.path !== '/') return resolveKey()

    // If no path, check .well-known first
    datDns.resolveName(link, function (err, key) {
      if (key) return cb(null, key)
      if (err) debug('datDns.resolveName() error', err)
      resolveKey()
    })

    function resolveKey () {
      var urlLink = link.indexOf('http') > -1 ? link : 'http://' + link
      nets({ url: urlLink, json: true }, function (err, resp, body) {
        if (err) return cb(err)
        if (resp.statusCode !== 200) return cb(body.message)

        // first check if key is in header response
        key = resp.headers['hyperdrive-key'] || resp.headers['dat-key']
        if (key) {
          debug('Received key from http header:', key)
          return cb(null, key)
        }

        // else fall back to parsing the body
        try {
          key = stringKey(body.url)
          debug('Received key via json:', key)
          if (key) return cb(null, key)
        } catch (e) {
          cb(new Error(e))
        }
        cb(new Error('Unable to lookup key from http link.'))
      })
    }
  }
}
