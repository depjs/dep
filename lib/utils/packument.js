import npmrc from './npmrc.js'
import { fetchJSON } from './fetch.js'

// Fetch a registry packument (the full document with every published version),
// memoised by package name. A package referenced by many ranges across the
// tree is then downloaded only once instead of once per range.
const cache = new Map()

export default (escapedName) => {
  if (cache.has(escapedName)) return cache.get(escapedName)
  const p = fetchJSON(npmrc.registry + escapedName)
  cache.set(escapedName, p)
  return p
}
