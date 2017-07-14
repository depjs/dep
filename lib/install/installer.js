const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const npmrc = require('../utils/npmrc')
const { URL } = require('url')
const path = require('path')
const nm = require('../utils/nm')
const bin = require('./bin')

const installer = (keys, tree, base, cb) => {
  mkdirp.sync(nm)
  mkdirp.sync(path.join(nm, '.bin'))
  return keys.map((key) => {
    const hasDeps = typeof tree[key] === 'object' && tree[key].dependencies
    const target = base ? path.join(nm, base, 'node_modules', key) : path.join(nm, key)
    const url = new URL(tree[key].tarball)
    mkdirp.sync(target)
    global.dependenciesCount += 1
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
            sync: true,
            strip: 1
          })
        )
        res.on('end', () => {
          bin(key, target)
          if (!hasDeps) return resolve()
          if (!cb) return resolve()
          cb()
        })
      }).on('error', reject)
    })
  })
}

module.exports = installer
