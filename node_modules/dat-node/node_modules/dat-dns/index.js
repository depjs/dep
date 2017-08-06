var debug = require('debug')('dat')
var dns = require('dns')
var url = require('url')
var https = require('https')
var cache = require('./cache')
var maybe = require('call-me-maybe')
var concat = require('concat-stream')

var DAT_HASH_REGEX = /^[0-9a-f]{64}$/i
var DEFAULT_DAT_DNS_TTL = 3600 // 1hr
var MAX_DAT_DNS_TTL = 3600 * 24 * 7 // 1 week

module.exports = function () {
  function resolveName (name, opts, cb) {
    if (typeof opts === 'function') {
      cb = opts
      opts = null
    }
    var ignoreCache = opts && opts.ignoreCache
    var ignoreCachedMiss = opts && opts.ignoreCachedMiss
    return maybe(cb, new Promise(function (resolve, reject) {
      // parse the name as needed
      var nameParsed = url.parse(name)
      name = nameParsed.hostname || nameParsed.pathname

      // is it a hash?
      if (DAT_HASH_REGEX.test(name)) {
        return resolve(name)
      }

      // check the cache
      if (!ignoreCache) {
        const cachedKey = cache.get(name)
        if (typeof cachedKey !== 'undefined') {
          if (cachedKey || (!cachedKey && !ignoreCachedMiss)) {
            debug('DNS-over-HTTPS cache hit for name', name, cachedKey)
            if (cachedKey) return resolve(cachedKey)
            else return reject(new Error('DNS record not found'))
          }
        }
      }

      // do a dns-over-https lookup
      requestRecord(name, resolve, reject)
    }))
  }

  function requestRecord (name, resolve, reject) {
    debug('DNS-over-HTTPS lookup for name:', name)
    https.get({
      host: name,
      path: '/.well-known/dat',
      timeout: 2000
    }, function (res) {
      res.setEncoding('utf-8')
      res.pipe(concat(function (body) {
        parseResult(name, body, resolve, reject)
      }))
    }).on('error', function (err) {
      debug('DNS-over-HTTPS lookup failed for name:', name, err)
      cache.set(name, false, 60) // cache the miss for a minute
      reject(new Error('DNS record not found'))
    })
  }

  function parseResult (name, body, resolve, reject) {
    if (!body || typeof body != 'string') {
      return reject(new Error('DNS record not found'))
    }
  
    const lines = body.split('\n')
    var key, ttl

    // parse url
    try {
      key = /^dat:\/\/([0-9a-f]{64})/i.exec(lines[0])[1]
    } catch (e) {
      debug('DNS-over-HTTPS failed', name, 'Must be a dat://{hash} url')
      return reject(new Error('Invalid record'))
    }

    // parse ttl
    try {
      if (lines[1]) {
        ttl = +(/^ttl=(\d+)$/i.exec(lines[1])[1])
      }
    } catch (e) {
      debug('DNS-over-HTTPS failed to parse TTL for %s, line: %s, error:', name, lines[1], e)
    }
    if (!Number.isSafeInteger(ttl) || ttl < 0) {
      ttl = DEFAULT_DAT_DNS_TTL
    }
    if (ttl > MAX_DAT_DNS_TTL) {
      ttl = MAX_DAT_DNS_TTL
    }

    // cache
    if (ttl !== 0) {
      cache.set(name, key, ttl)
    }
    debug('DNS-over-HTTPS resolved', name, 'to', key)
    resolve(key)
  }

  function listCache () {
    return cache.list()
  }

  function flushCache () {
    cache.flush()
  }

  return { 
    resolveName: resolveName,
    listCache: listCache,
    flushCache: flushCache
  }
}
