const path = require('path')
const tree = require('./lock/tree')
const locker = require('./lock/locker')

global.dependenciesTree = {}

function lock (argv) {
  argv._handled = true
  const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    lockfileVersion: 1,
  }
  tree()
  lock.dependencies = global.dependenciesTree
  locker(lock)
  process.stdout.write(
    `created node_modules.json\n`
  )
}

module.exports = {
  command: 'lock',
  describe: 'Generate node_modules.json',
  handler: lock,
  aliases: ['l']
}
