const https = require('https')
const mkdirp = require('mkdirp')
const tar = require('tar')
const npmrc = require('../utils/npmrc')
const { URL } = require('url')
const path = require('path')
const nm = require('../utils/nm')
const bin = require('./bin')
const registry = require('./installer/registry')

const installer = (dep, deps, base, resolve, reject) => {
  mkdirp.sync(nm)
  mkdirp.sync(path.join(nm, '.bin'))

  const target = (base.length === 0)
    ? path.join(nm, dep)
    : path.join(nm, base.join('/'), 'node_modules', dep)
  mkdirp.sync(target)

  const pkg = deps[dep]
  let fetch = registry(pkg, target)
  fetch.then(() => {
    global.dependenciesCount += 1
    bin(dep, target)
    if (!pkg.dependencies) return resolve()
    const tasks = Object.keys(pkg.dependencies).map((item) => {
      const list = pkg.dependencies
      let keys = [].concat(base, dep)
      if (keys.length > 1) keys.splice(-1, 0, 'node_modules')
      return new Promise((resolve, reject) => {
        installer(item, list, keys, resolve, reject)
      })
    })
    Promise.all(tasks).then(() => {
      resolve()
    })
  })
}

module.exports = (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => installer(dep, deps, [], resolve, reject))
  })
}
