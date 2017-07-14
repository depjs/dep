const path = require('path')
const locker = require('./lock/locker')

function lock (argv) {
  argv._handled = true
  const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    lockfileVersion: 1
  }
  locker(lock)
}

module.exports = {
  command: 'lock',
  describe: 'Generate package-lock.json',
  handler: lock,
  aliases: ['l']
}
