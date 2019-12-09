const path = require('path')
const resolver = require('./lock/resolver')
const locker = require('./lock/locker')
const dep = require('../package')

global.dependenciesTree = {}

const lock = (argv) => {
  argv._handled = true
  const pkgJSON = require(path.join(process.cwd(), 'package.json'))
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    depVersion: dep.version
  }
  const list = resolver()
  process.stdout.write('Resolving dependencies\n')
  Promise.all(list).then(() => {
    lock.dependencies = global.dependenciesTree
    locker(lock)
    process.stdout.write(
      'created node_modules.json\n'
    )
  }).catch((e) => { process.stderr.write(e.stack) })
}

module.exports = {
  command: 'lock',
  describe: 'Lock dependencies installed in node_modules',
  handler: lock,
  aliases: ['l']
}
