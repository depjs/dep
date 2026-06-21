import semver from './semver.js'
import pool from './pool.js'

const CONCURRENCY = Math.max(1, Number(process.env.DEP_CONCURRENCY) || 16)

// Resolve a dependency graph into the hoisted tree shape consumed by the
// installer and locker (a top-level name->node map, with conflicting versions
// nested under a parent's `.dependencies`).
//
// Two phases:
//   1. Fetch every reachable package's metadata in parallel, de-duplicated by
//      `name@spec` (and, for the registry, by packument). This is where the
//      time goes, so it runs fully concurrently and never fetches the same
//      thing twice.
//   2. Build the tree with a deterministic breadth-first walk over the cached
//      metadata. Processing shallower dependencies first lets direct deps claim
//      the top-level (hoisted) slots, with conflicting deeper versions nested
//      under their parent — and the output is identical on every run regardless
//      of network timing.

const setter = (list, key, value, walk) => {
  let i = 0
  let depth = 1
  let ref = list
  // optimize the shallowness as much as possible
  while (i < walk.length) {
    const words = walk[i].split('@')
    const name = words.length === 3
      ? '@' + walk[i].split('@')[0] + walk[i].split('@')[1]
      : walk[i].split('@')[0]
    const version = words.length === 3
      ? walk[i].split('@')[2]
      : walk[i].split('@')[1]
    const isDeps = name === 'dependencies'
    if (isDeps || (ref[name] && ref[name].version === version)) {
      if (isDeps && !ref[name]) ref[name] = {}
      ref = ref[name]
      i++
    } else {
      ref = list
      i = 2 * depth
      depth++
    }
  }

  if (!ref.dependencies) ref.dependencies = {}
  ref.dependencies[key] = value
}

const metaKey = (name, spec) => `${name}@${spec || ''}`

// Match an npm os/cpu list (e.g. ["darwin","!win32"]) against a value.
const matchList = (list, value) => {
  if (!list || !list.length) return true
  const positives = list.filter((i) => i[0] !== '!')
  for (const item of list) {
    if (item[0] === '!' && item.slice(1) === value) return false
  }
  return positives.length ? positives.includes(value) : true
}

const matchesPlatform = (meta) =>
  matchList(meta.os, process.platform) && matchList(meta.cpu, process.arch)

// The edges to follow from a package: real dependencies, auto-installed
// (non-optional) peerDependencies, and optionalDependencies. Dependencies win
// on name conflicts; peers/optionals only add names not already required.
const edgesOf = (meta) => {
  const out = []
  const deps = meta.dependencies || {}
  for (const name of Object.keys(deps)) out.push({ name, range: deps[name], optional: false })

  const peerInfo = meta.peerDependenciesMeta || {}
  const peers = meta.peerDependencies || {}
  for (const name of Object.keys(peers)) {
    if (name in deps) continue
    if (peerInfo[name] && peerInfo[name].optional) continue
    out.push({ name, range: peers[name], optional: false })
  }

  const optionals = meta.optionalDependencies || {}
  for (const name of Object.keys(optionals)) {
    if (name in deps) continue
    out.push({ name, range: optionals[name], optional: true })
  }
  return out
}

export default (deps, fetcher, opts = {}) => {
  const { keepRequires = false, optional: optionalRoots = new Set(), skipPlatform = false } = opts
  const tree = global.dependenciesTree
  const cache = new Map() // name@spec -> in-flight promise
  const metas = new Map() // name@spec -> resolved metadata
  const required = new Set() // name@spec reached through a non-optional edge
  const pending = []
  const limit = pool(CONCURRENCY)
  let firstError = null

  // --- phase 1: fetch all metadata, concurrently (bounded) and de-duplicated ---
  const schedule = (name, spec, optional) => {
    const key = metaKey(name, spec)
    if (!optional) required.add(key)
    if (cache.has(key)) return
    const p = limit(() => fetcher(name, spec))
      .then((meta) => {
        metas.set(key, meta)
        for (const e of edgesOf(meta)) schedule(e.name, e.range, optional || e.optional)
      })
      // A failed optional dependency is skipped; a required one aborts.
      .catch((e) => { if (required.has(key) && !firstError) firstError = e })
    cache.set(key, p)
    pending.push(p)
  }

  const drain = async () => {
    // pending grows as metadata arrives; await every entry (including the ones
    // appended while draining), then surface the first error, if any.
    for (let i = 0; i < pending.length; i++) await pending[i]
    if (firstError) throw firstError
  }

  // --- phase 2: build the hoisted tree breadth-first (deterministic) ---
  const build = () => {
    const queue = Object.keys(deps).map((name) => ({
      name, range: deps[name], base: [], optional: optionalRoots.has(name)
    }))
    const visited = new Set()

    while (queue.length) {
      const { name, range, base, optional } = queue.shift()

      // Already satisfied by the hoisted top-level copy.
      if (tree[name] && tree[name].version && semver.satisfies(tree[name].version, range)) {
        continue
      }

      const meta = metas.get(metaKey(name, range))
      if (!meta || !meta.version) continue // optional that failed to resolve

      // Skip optional packages that can't run on this platform (install only;
      // the lockfile keeps every platform's optionals).
      if (optional && skipPlatform && !matchesPlatform(meta)) continue

      // Skip identical (path, dep, version) work — guards against cycles and
      // redundant nesting.
      const mark = `${base.join('|')}|${name}@${meta.version}`
      if (visited.has(mark)) continue
      visited.add(mark)

      const item = Object.assign({}, meta)
      // `requires` (and the node's peer/optionalDependencies) keep their own
      // meaning in the lockfile; only `dependencies` becomes resolved children.
      if (keepRequires) item.requires = meta.dependencies
      delete item.dependencies
      // First (shallowest) occurrence hoists to the top; conflicts nest.
      if (!tree[name]) tree[name] = item
      else setter(tree, name, item, base)

      const edges = edgesOf(meta)
      if (!edges.length) continue
      const id = `${name}@${meta.version}`
      const childBase = base.length === 0 ? [id] : [...base, 'dependencies', id]
      for (const e of edges) {
        queue.push({ name: e.name, range: e.range, base: childBase, optional: optional || e.optional })
      }
    }
  }

  for (const name of Object.keys(deps)) schedule(name, deps[name], optionalRoots.has(name))

  return drain().then(build)
}
