const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const npmrc = require('../utils/npmrc')
const URL = require('url').URL
const path = require('path')
const fs = require('fs')
const node_modules = path.join(process.env.PWD, 'node_modules')

module.exports = (keys, tree) => {
  mkdirp.sync(node_modules)
  mkdirp.sync(path.join(node_modules, '.bin')) 
  return keys.map((key) => {
    const target = path.join(node_modules, key)
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
        res.on('end', () => {
          const pkgJSON = require(path.join(target, 'package.json'))
          if (!pkgJSON.bin) return resolve()
          if (typeof pkgJSON.bin === 'string') {
            fs.symlinkSync(
              path.join(target, pkgJSON.bin),
              path.join(node_modules, '.bin', key)
            )
          } else if (typeof pkgJSON.bin === 'object') {
            Object.keys(pkgJSON.bin).forEach((cmd) => {
              fs.symlinkSync(
                path.join(target, pkgJSON.bin[cmd]),
                path.join(node_modules, '.bin', cmd)
              )
            })
          }
          resolve()
        })
      }).on('error', reject)
    })
  })
}
