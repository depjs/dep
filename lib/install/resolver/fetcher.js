const npa = require('npm-package-arg')
const git = require('./fetchers/git')
const local = require('./fetchers/local')
const remote = require('./fetchers/remote')
const registry = require('./fetchers/registry')

module.exports = (name, spec) => {
  let result
  try {
    result = npa.resolve(name, spec, process.cwd())
  } catch (e) { throw new Error(e) }

  switch (result.type) {
    // type git
    case 'git':
      return git(name, spec, result)
    // type remote
    case 'remote':
      return remote(name, spec, result)
    // type local
    case 'file':
    case 'directory':
      return local(name, spec, result
    // type registry
    case 'tag':
    case 'range':
    case 'version':
    default:
      return registry(name, spec, result)
  }
}
