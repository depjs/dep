const git = require('../../utils/git')

module.exports = (pkg, cwd) => {
  const url = pkg.url.split('#')[0]
  const hash = pkg.url.split('#')[1]
  git.sync(['clone', url, cwd])
  return git(['checkout', hash], {cwd: cwd})
}
