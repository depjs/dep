const which = require('which')
const { execFile } = require('child_process')
const prefix = process.platform === 'win32' ? ['-c', 'core.longpaths=true'] : []

module.exports = (pkg, cwd) => {
  return new Promise((resolve, reject) => {
    which('git', function (e, git) {
      if (e) return reject(e)
      const args = prefix.concat(['clone', pkg.url, cwd])
      execFile(git, args, (e) => {
        if (e) return reject(e)
        resolve()
      })
    })
  })
}
