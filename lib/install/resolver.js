const path = require('path')
const https = require('https')
const semver = require('semver')
const npmrc = require('../utils/npmrc')
const { URL } = require('url')
const deeper = require('../utils/deeper')
const heaper = require('../utils/heaper')

const resolver = (dep, deps, base, resolve, reject) => {
  const url = new URL(path.join(dep, deps[dep]), npmrc.registry)
  https.get({
    host: url.host,
    path: url.pathname,
    headers: npmrc.userAgent
  }, (res) => {
    // Search for all related module files referenced by require
    if (global.dependenciesTree[dep] && global.dependenciesTree[dep].version) {
      if (semver.satisfies(global.dependenciesTree[dep].version, deps[dep])) {
        return resolve()
      }
    }
    for (let i = 0; base.length > i; i += 2) {
      let target = heaper(global.dependenciesTree, base.slice(0, i))
      if (target && target[dep] && target[dep].version) {
        if (semver.satisfies(target[dep].version, deps[dep])) {
          return resolve()
        }
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
        deeper(global.dependenciesTree, dep, {
          version: body.version,
          tarball: body.dist.tarball,
          shuasum: body.dist.shasum
        }, base)
      }

      if (!body.dependencies) return resolve()

      const tasks = Object.keys(body.dependencies).map((item) => {
        const list = body.dependencies
        let keys = base.length === 0
          ? [].concat(`${dep}@${body.version}`)
          : [].concat(base, 'dependencies', `${dep}@${body.version}`)
        return new Promise((resolve, reject) => {
          resolver(item, list, keys, resolve, reject)
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
