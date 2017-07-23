const npa = require('npm-package-arg')
const url = require('./url')
const file = require('./file')
const registry = require('./registry')

module.exports = (dep, deps) => {
  let parsed
  try {
    parsed = npa(deps[dep], process.cwd())
  } catch (e) { throw new Error(e) }

  switch (parsed.type) {
    case 'git':
    case 'remote':
      return url(dep, deps, parsed)
    case 'file':
    case 'directory':
      return file(dep, deps, parsed)
    case 'version':
    case 'range':
    case 'tag':
    default:
      return registry(dep, deps)
  }
}
