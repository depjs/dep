const fs = require('fs')
const path = require('path')
const npmrc = require('../utils/npmrc')
const pkgJSON = require(path.join(process.cwd(), 'package.json'))

module.exports = (pkgs, save) => {
  var saveDeps = {}
  pkgs.forEach((pkg) => {
    const key = pkg.split('@')[0]
    var value = pkg.split('@')[1]
    const dep = global.dependenciesTree[pkg]
    if (!value) {
      switch (dep.type) {
        case 'dat':
        case 'git':
        case 'remote':
        case 'local':
          value = dep.url
          break
        case 'registry':
          value = npmrc['save-prefix'] + dep.version
          break
      }
    }
    saveDeps[key] = value
  })
  const field = save === 'dev' ? 'devDependencies' : 'dependencies'
  const oldDeps = pkgJSON[field] || {}
  const newDeps = Object.assign({}, oldDeps, saveDeps)
  pkgJSON[field] = newDeps
  fs.writeFileSync(
    path.join(process.cwd(), 'package.json'),
    JSON.stringify(pkgJSON, 2, 2)
  )
}
