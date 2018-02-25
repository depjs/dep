const npa = require('npm-package-arg')
const git = require('./fetchers/git')
const local = require('./fetchers/local')
const remote = require('./fetchers/remote')
const registry = require('./fetchers/registry')

module.exports = (name, spec) => {
  const pkg = spec ? `${name}@${spec}` : name
  const result = npa(pkg, process.cwd())

  switch (result.type) {
    // type git
    case 'git':
      return git(name, result.fetchSpec, result)
    // type remote
    case 'remote':
      return remote(name, result.fetchSpec, result)
    // type local
    case 'file':
    case 'directory':
      return local(name, result.fetchSpec, result)
    // type registry
    case 'tag':
    case 'range':
    case 'version':
    default:
      return registry(name, result.fetchSpec, result)
  }
}
