const path = require('path')
const resolver = require('./lock/resolver')
const locker = require('./lock/locker')

global.dependenciesTree = {}

const lock = (argv) => {
  argv._handled = true
  const pkgJSON = require(path.join(process.cwd(), 'package.json'))
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    lockfileVersion: 1
  }
  var deps = Object.assign(
    {},
    pkgJSON.optionalDependencies || {},
    pkgJSON.devDependencies || {},
    pkgJSON.dependencies || {}
  )

  const list = resolver(deps)
  process.stdout.write('Resolving dependencies\n')
  Promise.all(list).then(() => {
    lock.dependencies = global.dependenciesTree
    locker(lock)
    process.stdout.write(
      'created package-lock.json\n'
    )
  }).catch((e) => { process.stderr.write(e.stack) })
}

module.exports = {
  command: 'lock',
  describe: 'Lock dependencies installed in node_modules',
  handler: lock,
  aliases: ['l']
}
