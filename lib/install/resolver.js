const path = require('path')
const https = require('https')
const semver = require('semver')
const npmrc = require('../utils/npmrc')
const URL = require('url').URL

const resolver = (dep, deps, resolve, reject) => {
  const url = new URL(path.join(dep, deps[dep]), npmrc.registry)
  https.get(url.href, (res) => {
    let body = ''
    res.on('data', (chunk) => { body += chunk })
    res.on('end', () => {
      dependenciesTree[dep] = {}
      try {
        body = JSON.parse(body)
      } catch (e) {
        reject(e)
      }
      dependenciesTree[dep].version = body.version
      if (body.type !== 'git') {
        dependenciesTree[dep].tarball = body.dist.tarball
        dependenciesTree[dep].shasum = body.dist.shasum
      }
      if (body.dependencies) {
        const tasks = Object.keys(body.dependencies).map((dep) => {
          return new Promise((resolve, reject) => resolver(dep, body.dependencies, resolve, reject))
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
    return new Promise((resolve, reject) => resolver(dep, deps, resolve, reject))
  })
}
