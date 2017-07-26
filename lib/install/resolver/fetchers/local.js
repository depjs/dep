const { resolve, join } = require('path')

module.exports = (name, spec, result) => {
  spec = spec.replace('file:', '')
  if (spec[0] === '~') {
    spec = join(process.env.HOME, spec.slice(1))
  }
  spec = resolve(spec)
  const pkgJSON = spec.indexOf('package.json') !== -1
    ? spec
    : join(spec, 'package.json')
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
