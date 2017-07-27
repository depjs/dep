const https = require('https')
const URL = require('url').URL
const npmrc = require('../../../utils/npmrc')

module.exports = (name, spec, result) => {
  const url = new URL(name + '/' + spec, npmrc.registry)
  return new Promise((resolve, reject) => {
    https.get({
      host: url.host,
      path: url.pathname,
      headers: npmrc.userAgent
    }, (res) => {
      var body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          body = JSON.parse(body)
          resolve({
            type: 'registry',
            version: body.version,
            dependencies: body.dependencies,
            tarball: body.dist.tarball,
            shasum: body.dist.shasum
          })
        } catch (e) { return reject(e) }
      })
    }).on('error', reject)
  })
}
