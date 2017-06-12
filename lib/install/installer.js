const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const URL = require('url').URL
const path = require('path')

module.exports = (keys, tree) => {
  return keys.map((key) => {
    const url = new URL(tree[key].tarball)
    const target = path.join(process.env.PWD, 'node_modules', key)
    return new Promise((resolve, reject) => {
      mkdirp.sync(target)
      https.get(url.href, (res) => {
        res.on('data', (chunk) => {
          tar.x({
            C: target
          })
        })
        res.on('end', resolve)
      }).on('error', reject)
    })
  })
}
