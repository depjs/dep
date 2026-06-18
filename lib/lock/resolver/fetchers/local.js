import path from 'path'
import fs from 'fs'

export default (name, spec, result) => {
  const pkgJSON = spec.indexOf('package.json') !== -1
    ? spec
    : path.join(spec, 'package.json')
  return new Promise((resolve, reject) => {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJSON))
      resolve({
        type: 'local',
        version: pkg.version,
        dependencies: pkg.dependencies,
        url: spec
      })
    } catch (e) { reject(e) }
  })
}
