const path = require('path')
const resolver = require('./install/resolver')
const installer = require('./install/installer')
const nodeGyp = require('./utils/node-gyp')

global.dependenciesCount = 0
global.dependenciesTree = {}
global.nativeBuildQueue = []
global.time = process.hrtime()

const install = (argv) => {
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
  const deps = allDependencies
  const list = resolver(deps)
  Promise.all(list).then(() => {
    const tasks = installer(global.dependenciesTree)
    Promise.all(tasks).then(() => {
      global.nativeBuildQueue.forEach((cwd) => {
        try {
          nodeGyp({cwd: cwd})
        } catch (e) {} // ignore the error since the deps could be optional
      })
      const duration = process.hrtime(global.time)
      const time = duration[0] + duration[1] / 1e9
      const s = Math.round(time * 1000) / 1000
      process.stdout.write(
        `added ${global.dependenciesCount} packages in ${s}s\n`
      )
    }).catch(console.error)
  }).catch(console.error)
}

module.exports = {
  command: 'install',
  describe: 'Install dependencies',
  handler: install,
  aliases: ['i']
}
