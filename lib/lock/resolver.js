const https = require('https')
const path = require('path')
const URL = require('url').URL
const fs = require('fs')
const readdirSync = require('fs').readdirSync
const npmrc = require('../utils/npmrc')
const nm = require('../utils/nm')

const resolver = (dep, base, resolve, reject) => {
  base = base || nm
  const pkgJSON = require(path.join(base, dep, 'package.json'))
  const url = new URL(path.join(pkgJSON.name, pkgJSON.version), npmrc.registry)
  https.get({
    host: url.host,
    path: url.pathname,
    headers: npmrc.userAgent
  }, (res) => {
    var body = ''
    res.on('data', (chunk) => { body += chunk })
    res.on('end', () => {
      try {
        body = JSON.parse(body)
      } catch (e) { reject(e) }
      if (base === nm) {
        global.dependenciesTree[pkgJSON.name] = {
          version: body.version,
          tarball: body.dist.tarball,
          shasum: body.dist.shasum
        }
      } else {
        base = base.split('/').slice(-2)[0]
        if (!global.dependenciesTree[base].dependencies) {
          global.dependenciesTree[base].dependencies = {}
        }
        global.dependenciesTree[base].dependencies[dep] = {}
        global.dependenciesTree[base].dependencies[dep].version = body.version
        global.dependenciesTree[base].dependencies[dep].tarball = body.dist.tarball
        global.dependenciesTree[base].dependencies[dep].shasum = body.dist.shasum
      }
      const dir = path.join(base, dep, 'node_modules')
      if (fs.existsSync(dir)) {
        const deps = readdirSync(dir).filter((n) => {
          return n[0] !== '.'
        })
        const tasks = deps.map((dep) => {
          return new Promise((resolve, reject) => resolver(dep, dir, resolve, reject))
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

module.exports = () => {
  const deps = readdirSync(nm).filter((n) => {
    return n[0] !== '.'
  })
  return deps.map((dep) => {
    return new Promise((resolve, reject) => resolver(dep, null, resolve, reject))
  })
}
