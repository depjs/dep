const os = require('os')
const path = require('path')
const Dat = require('dat-node')
const rimraf = require('rimraf')

module.exports = (name, spec, result) => {
  const tmp = path.join(os.tmpdir(), encodeURIComponent(spec))
  return new Promise((resolve, reject) => {
    Dat(tmp, {key: spec, sparse: true}, (e, dat) => {
      if (e) return reject(e)
      dat.joinNetwork()
      dat.archive.readFile('/package.json', (e, content) => {
        if (e) {
          dat.leaveNetwork()
          reject(e)
        }
        if (!content) return
        dat.leaveNetwork()
        rimraf(tmp)
        try {
          const pkg = JSON.parse(content.toString())
          resolve({
            type: 'dat',
            version: pkg.version,
            dependencies: pkg.dependencies,
            url: spec
          })
        } catch (e) {
          reject(e)
        }
      })
    })
  })
}
