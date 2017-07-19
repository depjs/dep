const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const npmrc = require('../utils/npmrc')
const { URL } = require('url')
const path = require('path')
const nm = require('../utils/nm')
const bin = require('./bin')

const installer = (dep, deps, base, resolve, reject) => {
  mkdirp.sync(nm)
  mkdirp.sync(path.join(nm, '.bin'))
  const target = (base.length === 0)
    ? path.join(nm, dep)
    : path.join(nm, base.join('/'), 'node_modules', dep)
  const url = new URL(deps[dep].tarball)
  mkdirp.sync(target)

if (base.length > 0) console.log(target)

  https.get({
    host: url.host,
    path: url.pathname,
    headers: npmrc.userAgent
    }, (res) => {
    res.pipe(
      tar.extract({
        cwd: target,
        sync: true,
        strip: 1
      })
    )
    res.on('end', () => {
      global.dependenciesCount += 1
      bin(dep, target)
      if (!deps[dep].dependencies) return resolve()
      const tasks = Object.keys(deps[dep].dependencies).map((item) => {
        const list = deps[dep].dependencies
        let keys = [].concat(base, dep)
        if (keys.length > 1) keys.splice(-1, 0, 'node_modules')
        return new Promise((resolve, reject) => {
          installer(item, list, keys, resolve, reject)
        })
      })
    })
  }).on('error', reject)
}

module.exports = (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => installer(dep, deps, [], resolve, reject))
  })
}
