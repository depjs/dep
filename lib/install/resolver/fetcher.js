const npa = require('npm-package-arg')
const dat = require('./fetchers/dat')
const git = require('./fetchers/git')
const local = require('./fetchers/local')
const remote = require('./fetchers/remote')
const registry = require('./fetchers/registry')

module.exports = (name, spec) => {
  var result
  try {
    if (spec.startsWith('dat:')) {
      result = {
        type: 'dat',
        fetchSpec: spec
      }
    } else {
      result = npa.resolve(name, spec, process.cwd())
    }
  } catch (e) { throw new Error(e) }

  switch (result.type) {
    // type git
    case 'dat':
      process.stdout.write(
        'Using dat as deps is an experimental feature.\n' +
        'It could be changed at any time.\n\n'
      )
      return dat(name, result.fetchSpec, result)
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
