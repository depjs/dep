const path = require('path')
const resolver = require('./install/resolver')
const locker = require('./lock/locker')

global.dependenciesTree = {}

function lock (argv) {
  argv._handled = true
  const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
  const dependencies = pkgJSON.dependencies || {}
  const devDependencies = pkgJSON.devDependencies || {}
  const optionalDependencies = pkgJSON.optionalDependencies || {}
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    lockfileVersion: 1
  }
  const allDependencies = Object.assign(
    optionalDependencies,
    devDependencies,
    dependencies
  )
  const deps = allDependencies
  const list = resolver(deps)
  Promise.all(list).then(() => {
    lock.dependencies = global.dependenciesTree
    locker(lock)
    process.stdout.write(
      `created package-lock.json\n`
    )
  })
}

module.exports = {
  command: 'lock',
  describe: 'Generate package-lock.json',
  handler: lock,
  aliases: ['l']
}
