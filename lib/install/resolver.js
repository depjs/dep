import resolveTree from '../utils/resolve-tree.js'
import fetcher from './resolver/fetcher.js'

export default (deps) => {
  return [resolveTree(deps, fetcher, false)]
}
