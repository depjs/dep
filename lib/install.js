/* global dependenciesTree */
const path = require('path')
const resolver = require('./install/resolver')
const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
const dependencies = pkgJSON.dependencies || {}
const devDependencies = pkgJSON.devDependencies || {}
const lock = {
  name: pkgJSON.name,
  version: pkgJSON.version
}
global.dependenciesTree = {}

function install (argv) {
  argv._handled = true
  const deps = argv.dev ? devDependencies : dependencies
  const list = resolver(deps)
  Promise.all(list).then((data) => {
    if (Object.keys(dependenciesTree).length) {
      lock.dependencies = dependenciesTree
    }
    console.log(JSON.stringify(lock, 2, 2))
  })
}

module.exports = {
  command: 'install [dev]',
  describe: '',
  handler: install,
  aliases: ['i']
}
