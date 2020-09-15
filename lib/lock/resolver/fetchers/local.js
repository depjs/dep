const path = require('path')

module.exports = (name, spec, result) => {
  const pkgJSON = spec.indexOf('package.json') !== -1
    ? spec
    : path.join(spec, 'package.json')
  return new Promise((resolve, reject) => {
    try {
      const pkg = require(pkgJSON)
      resolve({
        type: 'local',
        version: pkg.version,
        dependencies: pkg.dependencies,
        url: spec
      })
    } catch (e) { reject(e) }
  })
}
