const { writeFileSync } = require('fs')
const path = require('path')
const pkgLockJSON = path.join(process.env.PWD, 'package-lock.json')

const locker = (pkg) => {
  writeFileSync(pkgLockJSON, JSON.stringify(pkg, 2, 2))
}

module.exports = locker
