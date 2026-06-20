import npa from '../../utils/npa.js'
import git from './fetchers/git.js'
import local from './fetchers/local.js'
import remote from './fetchers/remote.js'
import registry from './fetchers/registry.js'

export default (name, spec) => {
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
