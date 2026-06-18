import fs from 'fs-extra'

export default (pkg, cwd) => {
  return fs.copy(pkg.url, cwd)
}
