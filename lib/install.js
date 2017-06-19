const path = require('path')
const resolver = require('./install/resolver')
const installer = require('./install/installer')

global.dependenciesCount = 0
global.dependenciesTree = {}
global.time = process.hrtime()

function install (argv) {
  argv._handled = true
  const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
  const dependencies = pkgJSON.dependencies || {}
  const devDependencies = pkgJSON.devDependencies || {}
  const optionalDependencies = pkgJSON.optionalDependencies || {}
  const allDependencies = Object.assign(
    optionalDependencies,
    devDependencies,
    dependencies
  )
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version
  }
  const deps = argv.dev ? devDependencies : allDependencies
  const list = resolver(deps)
  Promise.all(list).then(() => {
    const keys = Object.keys(global.dependenciesTree)
    if (!keys.length) return
    lock.dependencies = global.dependenciesTree
    const tasks = installer(keys, global.dependenciesTree)
    Promise.all(tasks).then(() => {
      const duration = process.hrtime(global.time)
      const time = duration[0] + duration[1] / 1e9
      const s = Math.round(time * 1000) / 1000
      process.stdout.write(
        `added ${global.dependenciesCount} packages in ${s}s\n`
      )
    })
  })
}

module.exports = {
  command: 'install [dev]',
  describe: '',
  handler: install,
  aliases: ['i']
}
