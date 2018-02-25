const fs = require('fs-extra')
const path = require('path')
const nm = require('../utils/nm')
const bin = require('./installer/bin')
const git = require('./installer/git')
const local = require('./installer/local')
const remote = require('./installer/remote')
const registry = require('./installer/registry')
const runner = require('../run/runner')

const installer = (dep, deps, base, resolve, reject) => {
  fs.ensureDirSync(nm)
  fs.ensureDirSync(path.join(nm, '.bin'))

  const target = (base.length === 0)
    ? path.join(nm, dep)
    : path.join(nm, base.join('/'), 'node_modules', dep)
  fs.ensureDirSync(target)

  const pkg = deps[dep]
  var fetch

  switch (pkg.type) {
    case 'git':
      fetch = git(pkg, target)
      break
    case 'remote':
      fetch = remote(pkg, target)
      break
    case 'local':
      fetch = local(pkg, target)
      break
    case 'registry':
      fetch = registry(pkg, target)
      break
  }

  fetch.then(() => {
    return new Promise((resolve, reject) => {
      const args = ['', 'install']
      const pkg = require(path.join(target, 'package.json'))
      if (!pkg.scripts || (
        pkg.scripts.preinstall &&
        pkg.scripts.install &&
        pkg.scripts.postinstall
      )) return resolve()
      runner(args, pkg, target).then(resolve).catch(reject)
    })
  }).then(() => {
    global.dependenciesCount += 1
    bin(dep, target)
    if (fs.existsSync(path.join(target, 'binding.gyp'))) {
      global.nativeBuildQueue.push(target)
    }
    if (!pkg.dependencies) return resolve()
    const tasks = Object.keys(pkg.dependencies).map((item) => {
      const list = pkg.dependencies
      var keys = [].concat(base, dep)
      if (keys.length > 1) keys.splice(-1, 0, 'node_modules')
      return new Promise((resolve, reject) => {
        installer(item, list, keys, resolve, reject)
      })
    })
    Promise.all(tasks).then(() => {
      resolve()
    }).catch(reject)
  }).catch(reject)
}

module.exports = (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => installer(dep, deps, [], resolve, reject))
  })
}
