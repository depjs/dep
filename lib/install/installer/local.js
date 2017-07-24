const fs = require('fs-extra')

module.exports = (pkg, cwd) => {
  return fs.copy(pkg.url, cwd)
}
