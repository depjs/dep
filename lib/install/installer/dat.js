const Dat = require('dat-node')

module.exports = (pkg, cwd) => {
  return new Promise((resolve, reject) => {
    Dat(cwd, {key: pkg.url, sparse: true}, function (e, dat) {
      if (e) return reject(e)
      dat.joinNetwork()
      dat.archive.readFile('/package.json', function (e, content) {
        if (e) {
          dat.leaveNetwork()
          reject(e)
        }
        if (!content || !content.toString()) return
        dat.leaveNetwork()
        resolve()
      })
    })
  })
}
