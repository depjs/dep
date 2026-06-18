import path from 'path'
import fs from 'fs-extra'
import git from '../../utils/git.js'

export default (pkg, cwd) => {
  const url = pkg.url.split('#')[0]
  const hash = pkg.url.split('#')[1]

  git.sync(['clone', url, cwd, '--quiet'])
  if (!fs.pathExistsSync(path.join(cwd, '.gitmodules'))) {
    return git(['checkout', hash, '--quiet'], { cwd })
  }
  git.sync(['checkout', hash, '--quiet'], { cwd })
  return git(['submodule', 'update', '--init', '--recursive', '--quiet'], { cwd })
}
