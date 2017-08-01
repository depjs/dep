const os = require('os')
const path = require('path')
const Dat = require('dat-node')

module.exports = (name, spec, result) => {
  return new Promise((resolve, reject) => {
    Dat(path.join(os.tmpdir(), encodeURIComponent(spec)), {key: spec, sparse: true}, function (e, dat) {
      if (e) return reject(e)
      dat.joinNetwork()
      dat.archive.readFile('/package.json', function (e, content) {
        if (e) {
          dat.leaveNetwork()
          reject(e)
        }
        if (!content) return
        dat.leaveNetwork()
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
