const semver = require('semver')
const treeGetter = require('./tree/getter')
const treeSetter = require('./tree/setter')
const fetch = require('./type/fetch')

const resolver = (dep, deps, base, resolve, reject) => {
  // Search for all related module files referenced by require
  if (global.dependenciesTree[dep] && global.dependenciesTree[dep].version) {
    if (semver.satisfies(global.dependenciesTree[dep].version, deps[dep])) {
      return resolve()
    }
  }
  for (let i = 0; base.length > i; i += 2) {
    let target = treeGetter(global.dependenciesTree, base.slice(0, i))
    if (target && target[dep] && target[dep].version) {
      if (semver.satisfies(target[dep].version, deps[dep])) {
        return resolve()
      }
    }
  }
  fetch(dep, deps).then((pkg) => {
    if (!global.dependenciesTree[dep]) {
      global.dependenciesTree[dep] = {}
      global.dependenciesTree[dep].version = pkg.version
      global.dependenciesTree[dep].tarball = pkg.dist.tarball
      global.dependenciesTree[dep].shasum = pkg.dist.shasum
    } else {
      treeSetter(global.dependenciesTree, dep, {
        version: pkg.version,
        tarball: pkg.dist.tarball,
        shuasum: pkg.dist.shasum
      }, base)
    }

    if (!pkg.dependencies) return resolve()

    const tasks = Object.keys(pkg.dependencies).map((item) => {
      const list = pkg.dependencies
      let keys = base.length === 0
        ? [].concat(`${dep}@${pkg.version}`)
        : [].concat(base, 'dependencies', `${dep}@${pkg.version}`)
      return new Promise((resolve, reject) => {
        resolver(item, list, keys, resolve, reject)
      })
    })
    Promise.all(tasks).then(() => {
      resolve()
    }).catch(reject)
  }).catch(reject)
}

module.exports = (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => resolver(dep, deps, [], resolve, reject))
  })
}
