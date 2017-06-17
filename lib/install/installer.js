const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const npmrc = require('../utils/npmrc')
const URL = require('url').URL
const path = require('path')
// const fs = require('fs')
const nm = path.join(process.env.PWD, 'node_modules')

const installer = (keys, tree, base, cb) => {
  mkdirp.sync(nm)
  mkdirp.sync(path.join(nm, '.bin'))
  return keys.map((key) => {
    const hasDeps = typeof tree[key] === 'object' && tree[key].dependencies
    const target = base ? path.join(nm, base, 'node_modules', key) : path.join(nm, key)
    const url = new URL(tree[key].tarball)
    mkdirp.sync(target)
    return new Promise((resolve, reject) => {
      if (hasDeps) {
        installer(
          Object.keys(tree[key].dependencies),
          tree[key].dependencies,
          key,
          resolve
        )
      }
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
          // @TODO making bin symlinks is not ready yet
          /*
          const pkgJSON = require(path.join(target, 'package.json'))
          if (!pkgJSON.bin) return resolve()
          if (typeof pkgJSON.bin === 'string') {
            fs.symlinkSync(
              path.join(target, pkgJSON.bin),
              path.join(nm, '.bin', key)
            )
          } else if (typeof pkgJSON.bin === 'object') {
            Object.keys(pkgJSON.bin).forEach((cmd) => {
              fs.symlinkSync(
                path.join(target, pkgJSON.bin[cmd]),
                path.join(nm, '.bin', cmd)
              )
            })
          }
          */
          if (base) console.log(target)
          global.dependenciesCount += 1
          if (!hasDeps) return resolve()
          if (!cb) return resolve()
          cb()
        })
      }).on('error', reject)
    })
  })
}

module.exports = installer
