import resolveTree from '../utils/resolve-tree.js'
import npmrc from '../utils/npmrc.js'
import fetcher from './resolver/fetcher.js'
import { prefetch } from './prefetch.js'

const engineStrict = npmrc['engine-strict'] === true || npmrc['engine-strict'] === 'true'

// Installs enforce the current platform (os/cpu) and check engines; the lockfile
// stays cross-platform so those checks are off there.
export default (deps, optional, overrides) => {
  return [resolveTree(deps, fetcher, {
    keepRequires: false,
    optional,
    overrides,
    skipPlatform: true,
    checkEngines: true,
    engineStrict,
    // Start downloading each package's tarball as soon as it resolves,
    // overlapping the download/extract phase with the rest of resolution.
    onMeta: prefetch
  })]
}
