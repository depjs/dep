import npmrc from './npmrc.js'
import { fetchJSON } from './fetch.js'

// Fetch a registry packument (the document listing every published version),
// memoised by package name so a package referenced by many ranges is downloaded
// only once.
//
// Installs request the abbreviated ("corgi") format, which is far smaller and
// carries everything install needs (deps, dist, engines, os/cpu, peers, …).
// Locking asks for the full document so it can also record `license`/`funding`.
const ABBREVIATED = 'application/vnd.npm.install-v1+json'
const cache = new Map()

export default (escapedName, opts = {}) => {
  const full = !!opts.full
  const key = (full ? 'full:' : 'abbr:') + escapedName
  if (cache.has(key)) return cache.get(key)
  const accept = full ? 'application/json' : ABBREVIATED
  const p = fetchJSON(npmrc.registry + escapedName, accept)
  cache.set(key, p)
  return p
}
