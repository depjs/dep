/* global dependenciesTree */
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
    if (dependenciesTree[dep] && dependenciesTree[dep].version) {
      if (semver.satisfies(dependenciesTree[dep].version, deps[dep])){
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
        dependenciesTree[dep] = {}
        dependenciesTree[dep].version = body.version
        dependenciesTree[dep].tarball = body.dist.tarball
        dependenciesTree[dep].shasum = body.dist.shasum
      } else {
        if (!dependenciesTree[base].dependencies) {
          dependenciesTree[base].dependencies = {}
        }
        dependenciesTree[base].dependencies[dep] = {}
        dependenciesTree[base].dependencies[dep].version = body.version
        dependenciesTree[base].dependencies[dep].tarball = body.dist.tarball
        dependenciesTree[base].dependencies[dep].shasum = body.dist.shasum
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
