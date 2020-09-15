const writeFileSync = require('fs').writeFileSync
const path = require('path')
const pkgLockJSON = path.join(process.cwd(), 'package-lock.json')

const locker = (pkg) => {
  writeFileSync(pkgLockJSON, JSON.stringify(pkg, 2, 2))
}

module.exports = locker
