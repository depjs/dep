
'use strict'

const Url = require('url')
const tldjs = require('tldjs')
const memoize = require('fast-memoize')

const addhttp = (url) => {
  if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
    url = 'http://' + url
  }
  return url
}

const addHttpMemoize = memoize(addhttp)

const parseUrl = (url) => {
  if (typeof url !== 'string') {
    url = ''
  }

  const makeAsUrl = addHttpMemoize(url)
  const parsedUrl = Url.parse(makeAsUrl)

  if (!parsedUrl.protocol) parsedUrl.protocol = 'http'

  parsedUrl.domain = tldjs.getDomain(parsedUrl.hostname || parsedUrl.host)

  delete parsedUrl.auth
  delete parsedUrl.search
  // delete parsedUrl.query
  delete parsedUrl.href
  // delete parsedUrl.hash
  delete parsedUrl.slashes
  delete parsedUrl.pathname
  return parsedUrl
}

module.exports = memoize(parseUrl)
