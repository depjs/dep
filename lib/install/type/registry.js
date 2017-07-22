const path = require('path')
const https = require('https')
const { URL } = require('url')
const npmrc = require('../../utils/npmrc')

module.exports = (dep, deps) => {
  const url = new URL(path.join(dep, deps[dep]), npmrc.registry)
  return new Promise((resolve, reject) => {
    https.get({
      host: url.host,
      path: url.pathname,
      headers: npmrc.userAgent
    }, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          body = JSON.parse(body)
          resolve(body)
        } catch (e) { return reject(e) }
      })
    }).on('error', reject)
  })
}
