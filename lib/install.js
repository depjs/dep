const path = require('path')
const resolver = require('./install/resolver')
const installer = require('./install/installer')
const saver = require('./install/saver')
const nodeGyp = require('./utils/node-gyp')
const fs = require('fs-extra')
const nm = require('./utils/nm')
const dropPrivilege = require('./utils/drop-privilege')

global.dependenciesCount = 0
global.dependenciesTree = {}
global.nativeBuildQueue = []
global.time = process.hrtime()

const install = (argv) => {
  argv._handled = true
  const pkgs = argv._.length > 1 ? argv._.slice(1) : []
  const only = argv.only === 'dev' || argv.only === 'prod' ? argv.only : 'all'
  const save = argv.save === 'dev' || argv.save === 'prod' ? argv.save : null
  const pkgJSON = require(path.join(process.cwd(), 'package.json'))
  const optionalDependencies = pkgJSON.optionalDependencies || {}
  const allDependencies = {
    all: [
      'dependencies',
      'devDependencies'
    ],
    prod: [
      'dependencies'
    ],
    dev: [
      'devDependencies'
    ]
  }
  var deps = Object.assign({}, optionalDependencies)
  allDependencies[only].forEach((key) => {
    if (!pkgJSON[key]) return
    Object.assign(deps, pkgJSON[key])
  })
  pkgs.forEach((pkg) => {
    const key = pkg.split('@')[0]
    const value = pkg.split('@')[1] || ''
    deps[key] = value
  })
  const list = resolver(deps)
  process.stdout.write('Resolving dependencies\n')
  fs.removeSync(nm)
  Promise.all(list).then(() => {
    dropPrivilege() // if root
    const tasks = installer(global.dependenciesTree)
    process.stdout.write('Installing dependencies\n')
    Promise.all(tasks).then(() => {
      if (save) saver(pkgs, save)
      global.nativeBuildQueue.forEach((cwd) => {
        try {
          process.stdout.write('Building dependencies\n')
          nodeGyp({ cwd: cwd })
        } catch (e) {
          // remove the pkg since the deps could be optional
          fs.removeSync(cwd)
        }
      })
      const duration = process.hrtime(global.time)
      const time = duration[0] + duration[1] / 1e9
      const s = Math.round(time * 1000) / 1000
      process.stdout.write(
        `Installed ${global.dependenciesCount} packages in ${s}s\n`
      )
    }).catch((e) => { process.stderr.write(e.stack) })
  }).catch((e) => { process.stderr.write(e.stack) })
}

module.exports = {
  command: 'install',
  describe: 'Install dependencies defined in package.json',
  handler: install,
  aliases: ['i'],
  options: {
    only: {
      type: 'string'
    },
    save: {
      type: 'string'
    }
  }
}
