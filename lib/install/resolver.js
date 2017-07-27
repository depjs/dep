const semver = require('semver')
const tree = require('./resolver/tree')
const fetcher = require('./resolver/fetcher')

const resolver = (dep, deps, base, resolve, reject) => {
  // Search for all related module files referenced by require
  if (global.dependenciesTree[dep] && global.dependenciesTree[dep].version) {
    if (semver.satisfies(global.dependenciesTree[dep].version, deps[dep])) {
      return resolve()
    }
  }
  for (var i = 0; base.length > i; i += 2) {
    var target = tree.getter(global.dependenciesTree, base.slice(0, i))
    if (target && target[dep] && target[dep].version) {
      if (semver.satisfies(target[dep].version, deps[dep])) {
        return resolve()
      }
    }
  }
  fetcher(dep, deps[dep]).then((pkg) => {
    const item = Object.assign({}, pkg)
    delete item.dependencies
    if (!global.dependenciesTree[dep]) {
      global.dependenciesTree[dep] = item
    } else {
      tree.setter(global.dependenciesTree, dep, item, base)
    }

    if (!pkg.dependencies) return resolve()

    const tasks = Object.keys(pkg.dependencies).map((item) => {
      const list = pkg.dependencies
      var keys = base.length === 0
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
