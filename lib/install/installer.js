import fs from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import nm from '../utils/nm.js'
import pool from '../utils/pool.js'
import bin from './installer/bin.js'
import git from './installer/git.js'
import local from './installer/local.js'
import remote from './installer/remote.js'
import registry from './installer/registry.js'

// Bound the number of tarball downloads / extractions / git clones running at
// once so deep trees don't open thousands of sockets and file handles.
const CONCURRENCY = Math.max(1, Number(process.env.DEP_CONCURRENCY) || 16)
const limit = pool(CONCURRENCY)

const installer = (dep, deps, base, resolve, reject) => {
  fs.mkdirSync(nm, { recursive: true })
  fs.mkdirSync(path.join(nm, '.bin'), { recursive: true })

  const target = (base.length === 0)
    ? path.join(nm, dep)
    : path.join(nm, base.join('/'), 'node_modules', dep)
  fs.mkdirSync(target, { recursive: true })

  const pkg = deps[dep]
  let fetch

  // Defer the actual work into the pool (thunks) so only CONCURRENCY run at once.
  switch (pkg.type) {
    case 'git':
      fetch = limit(() => git(pkg, target))
      break
    case 'remote':
      fetch = limit(() => remote(pkg, target))
      break
    case 'local':
      fetch = limit(() => local(pkg, target))
      break
    case 'registry':
      fetch = limit(() => registry(pkg, target))
      break
  }

  fetch.then(async () => {
    // Defer this package's install/postinstall scripts until the whole tree is
    // on disk. Running them inline — right after this one tarball extracts —
    // races the rest of the install: because the tree is hoisted, a package's
    // own dependencies are siblings in node_modules being extracted
    // concurrently, so its postinstall can fire before they exist (e.g.
    // electron's `node install.js` requiring `ms` before `ms` is written).
    //
    // The resolver / lockfile metadata already records whether the package has
    // install scripts and which bins it exposes; only read the extracted
    // package.json when that metadata is absent (git/local/remote deps) —
    // re-reading it for every package adds up on large trees.
    let hasInstallScript = pkg.hasInstallScript
    let binField = pkg.bin
    if (hasInstallScript === undefined || binField === undefined) {
      const pkgJSON = JSON.parse(await readFile(path.join(target, 'package.json')))
      const scripts = pkgJSON.scripts || {}
      if (hasInstallScript === undefined) {
        hasInstallScript = !!(scripts.preinstall || scripts.install || scripts.postinstall)
      }
      if (binField === undefined) binField = pkgJSON.bin || null
    }
    if (hasInstallScript) global.lifecycleQueue.push(target)
    global.dependenciesCount += 1
    return bin(dep, target, binField)
  }).then(() => {
    if (fs.existsSync(path.join(target, 'binding.gyp'))) {
      global.nativeBuildQueue.push({ cwd: target, optional: !!pkg.optional })
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
