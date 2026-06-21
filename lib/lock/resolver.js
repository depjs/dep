import resolveTree from '../utils/resolve-tree.js'
import fetcher from './resolver/fetcher.js'

// keepRequires: retain each package's requested ranges for the lockfile.
// The lockfile is cross-platform, so platform-specific optionals are kept.
export default (deps, optional, overrides) => {
  return [resolveTree(deps, fetcher, { keepRequires: true, optional, overrides, skipPlatform: false })]
}
