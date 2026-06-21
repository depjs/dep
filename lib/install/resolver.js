import resolveTree from '../utils/resolve-tree.js'
import npmrc from '../utils/npmrc.js'
import fetcher from './resolver/fetcher.js'

const engineStrict = npmrc['engine-strict'] === true || npmrc['engine-strict'] === 'true'

// Installs enforce the current platform (os/cpu) and check engines; the lockfile
// stays cross-platform so those checks are off there.
export default (deps, optional) => {
  return [resolveTree(deps, fetcher, {
    keepRequires: false,
    optional,
    skipPlatform: true,
    checkEngines: true,
    engineStrict
  })]
}
