const path = require('path')
const fs = require('fs-extra')
const git = require('../../utils/git')

module.exports = (pkg, cwd) => {
  const url = pkg.url.split('#')[0]
  const hash = pkg.url.split('#')[1]

  git.sync(['clone', url, cwd, '--quiet'])
  if (!fs.pathExistsSync(path.join(cwd, '.gitmodules'))) {
    return git(['checkout', hash, '--quiet'], { cwd: cwd })
  }
  git.sync(['checkout', hash, '--quiet'], { cwd: cwd })
  return git(['submodule', 'update', '--init', '--recursive', '--quiet'], { cwd: cwd })
}
