import fs from 'fs'
import path from 'path'
import nm from '../utils/nm.js'
import bin from './installer/bin.js'
import git from './installer/git.js'
import local from './installer/local.js'
import remote from './installer/remote.js'
import registry from './installer/registry.js'
import runner from '../run/runner.js'

const installer = (dep, deps, base, resolve, reject) => {
  fs.mkdirSync(nm, { recursive: true })
  fs.mkdirSync(path.join(nm, '.bin'), { recursive: true })

  const target = (base.length === 0)
    ? path.join(nm, dep)
    : path.join(nm, base.join('/'), 'node_modules', dep)
  fs.mkdirSync(target, { recursive: true })

  const pkg = deps[dep]
  let fetch

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
      const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json')))
      if (!pkg.scripts || (
        !pkg.scripts.preinstall &&
        !pkg.scripts.install &&
        !pkg.scripts.postinstall
      )) return resolve()
      runner(args, pkg, target).then(resolve).catch(reject)
    })
  }).then(() => {
    global.dependenciesCount += 1
    return bin(dep, target)
  }).then(() => {
    if (fs.existsSync(path.join(target, 'binding.gyp'))) {
      global.nativeBuildQueue.push(target)
    }
    if (!pkg.dependencies) return resolve()
    const tasks = Object.keys(pkg.dependencies).map((item) => {
      const list = pkg.dependencies
      const keys = [].concat(base, dep)
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

export default (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => installer(dep, deps, [], resolve, reject))
  })
}
