/* global dependenciesTree */
const path = require('path')
const resolver = require('./install/resolver')
const installer = require('./install/installer')
const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
const dependencies = pkgJSON.dependencies || {}
const devDependencies = pkgJSON.devDependencies || {}
const optionalDependencies = pkgJSON.optionalDependencies || {}
const allDependencies = Object.assign(
  dependencies,
  devDependencies,
  optionalDependencies
)
const lock = {
  name: pkgJSON.name,
  version: pkgJSON.version
}
global.dependenciesTree = {}

function install (argv) {
  argv._handled = true
  const deps = argv.dev ? devDependencies : allDependencies
  const list = resolver(deps)
  Promise.all(list).then(() => {
    const keys = Object.keys(dependenciesTree)
    if (!keys.length) return
    lock.dependencies = dependenciesTree
    const tasks = installer(keys, dependenciesTree)
    Promise.all(tasks).then(() => {
      console.log('🐾')
    })
  })
}

module.exports = {
  command: 'install [dev]',
  describe: '',
  handler: install,
  aliases: ['i']
}
