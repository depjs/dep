const path = require('path')
const https = require('https')
const semver = require('semver')
const npmrc = require('../utils/npmrc')
const URL = require('url').URL

const resolver = (dep, deps, name, resolve, reject) => {
  const url = new URL(path.join(dep, deps[dep]), npmrc.registry)
  https.get({
    host: url.host,
    path: url.pathname,
    headers: npmrc.userAgent
  }, (res) => {
    let base = ''
    if (global.dependenciesTree[dep] && global.dependenciesTree[dep].version) {
      if (semver.satisfies(global.dependenciesTree[dep].version, deps[dep])) {
        return resolve()
      }
      base = name
    }
    let body = ''
    res.on('data', (chunk) => { body += chunk })
    res.on('end', () => {
      try {
        body = JSON.parse(body)
      } catch (e) { reject(e) }
      if (!base) {
        global.dependenciesTree[dep] = {}
        global.dependenciesTree[dep].version = body.version
        global.dependenciesTree[dep].tarball = body.dist.tarball
        global.dependenciesTree[dep].shasum = body.dist.shasum
      } else {
        if (!global.dependenciesTree[base].dependencies) {
          global.dependenciesTree[base].dependencies = {}
        }
        global.dependenciesTree[base].dependencies[dep] = {}
        global.dependenciesTree[base].dependencies[dep].version = body.version
        global.dependenciesTree[base].dependencies[dep].tarball = body.dist.tarball
        global.dependenciesTree[base].dependencies[dep].shasum = body.dist.shasum
      }
      if (body.dependencies) {
        const tasks = Object.keys(body.dependencies).map((dep) => {
          const deps = body.dependencies
          return new Promise((resolve, reject) => resolver(dep, deps, body.name, resolve, reject))
        })
        Promise.all(tasks).then(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }).on('error', reject)
}

module.exports = (deps) => {
  return Object.keys(deps).map((dep) => {
    return new Promise((resolve, reject) => resolver(dep, deps, null, resolve, reject))
  })
}
