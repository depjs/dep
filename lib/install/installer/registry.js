const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const { URL } = require('url')
const path = require('path')
const npmrc = require('../../utils/npmrc')
const nm = require('../../utils/nm')
const bin = require('../bin')

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
