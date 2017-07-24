const path = require('path')
const https = require('https')
const { URL } = require('url')
const npmrc = require('../../utils/npmrc')

module.exports = (name, spec, result) => {
  const hosted = result.hosted
  const filetemplate = hosted.filetemplate
    .replace('{auth@}', hosted.auth ? hosted.auth + '@' : '')
    .replace('{domain}', hosted.domain)
    .replace('{user}', hosted.user)
    .replace('{project}', hosted.project)
    .replace('{committish}', hosted.committish ? hosted.committish : 'master')
    .replace('{path}', 'package.json')
  const httpstemplate = hosted.httpstemplate
    .replace('{auth@}', hosted.auth ? hosted.auth + '@' : '')
    .replace('{domain}', hosted.domain)
    .replace('{user}', hosted.user)
    .replace('{project}', hosted.project)
    .replace('{committish}', hosted.committish ? hosted.committish : 'master')
  const url = new URL(filetemplate)

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
          resolve({
            type: 'git',
            version: body.version,
            dependencies: body.dependencies,
            url: httpstemplate
          })
        } catch (e) { return reject(e) }
      })
    }).on('error', reject)
  })
}
