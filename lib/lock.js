const path = require('path')
const resolver = require('./lock/resolver')
const locker = require('./lock/locker')
const dep = require('../package')

global.dependenciesTree = {}

function lock (argv) {
  argv._handled = true
  const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    depVersion: dep.version,
  }
  const list = resolver()
  Promise.all(list).then(() => {
    lock.dependencies = global.dependenciesTree
    locker(lock)
    process.stdout.write(
      `created node_modules.json\n`
    )
  })
}

module.exports = {
  command: 'lock',
  describe: 'Generate node_modules.json',
  handler: lock,
  aliases: ['l']
}
