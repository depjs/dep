const https = require('https')
const tar = require('tar')
const { URL } = require('url')
const npmrc = require('../../utils/npmrc')

module.exports = (pkg, cwd) => {
  const url = new URL(pkg.tarball)
  return new Promise((resolve, reject) => {
    https.get({
      host: url.host,
      path: url.pathname,
      headers: npmrc.userAgent
    }, (res) => {
      res.pipe(
        tar.extract({
          cwd: cwd,
          sync: true,
          strip: 1
        })
      )
      res.on('end', () => {
        resolve()
      })
    }).on('error', reject)
  })
}
