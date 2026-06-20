import resolveTree from '../utils/resolve-tree.js'
import fetcher from './resolver/fetcher.js'

// keepRequires: retain each package's requested ranges for the lockfile.
export default (deps) => {
  return [resolveTree(deps, fetcher, true)]
}
