const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const npmrc = require('../utils/npmrc')
const URL = require('url').URL
const path = require('path')

module.exports = (keys, tree) => {
  return keys.map((key) => {
    const target = path.join(process.env.PWD, 'node_modules', key)
    const url = new URL(tree[key].tarball)
    return new Promise((resolve, reject) => {
      mkdirp.sync(target)
      https.get({
        host: url.host,
        path: url.pathname,
        headers: npmrc.userAgent
      }, (res) => {
        res.pipe(
          tar.x({
            cwd: target,
            strip: 1
          })
        )
        res.on('end', resolve)
      }).on('error', reject)
    })
  })
}
