const path = require('path')
const https = require('https')
const semver = require('semver')
const npmrc = require('../utils/npmrc')
const { URL } = require('url')
const deeper = require('../utils/deeper')

const resolver = (dep, deps, base, resolve, reject) => {
  const url = new URL(path.join(dep, deps[dep]), npmrc.registry)
  https.get({
    host: url.host,
    path: url.pathname,
    headers: npmrc.userAgent
  }, (res) => {
    // @ToDo Search for all related module files referenced by require
    if (global.dependenciesTree[dep] && global.dependenciesTree[dep].version) {
      if (semver.satisfies(global.dependenciesTree[dep].version, deps[dep])) {
        return resolve()
      }
    }
    let body = ''
    res.on('data', (chunk) => { body += chunk })
    res.on('end', () => {
      try {
        body = JSON.parse(body)
      } catch (e) { return reject(e) }
      if (!global.dependenciesTree[dep]) {
        global.dependenciesTree[dep] = {}
        global.dependenciesTree[dep].version = body.version
        global.dependenciesTree[dep].tarball = body.dist.tarball
        global.dependenciesTree[dep].shasum = body.dist.shasum
      } else {
        // @ToDo optimize the depth as much as shallow
        deeper(global.dependenciesTree, {
          version: body.version,
          tarball: body.dist.tarball,
          shuasum: body.dist.shasum
        }, base)
      }

      if (!body.dependencies) return resolve()

      const tasks = Object.keys(body.dependencies).map((dep) => {
        const deps = body.dependencies
        let keys = [].concat(base, dep).splice(-1, 0, 'dependencies')
        return new Promise((resolve, reject) => {
          resolver(dep, deps, keys, resolve, reject)
        })
      })
      Promise.all(tasks).then(() => {
        resolve()
      })
    })
  }).on('error', reject)
}

module.exports = (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => resolver(dep, deps, [], resolve, reject))
  })
}
