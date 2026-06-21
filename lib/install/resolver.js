import resolveTree from '../utils/resolve-tree.js'
import fetcher from './resolver/fetcher.js'

// skipPlatform: drop optional deps that can't run on this platform.
export default (deps, optional) => {
  return [resolveTree(deps, fetcher, { keepRequires: false, optional, skipPlatform: true })]
}
