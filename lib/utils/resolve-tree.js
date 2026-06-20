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

export default (deps, fetcher, keepRequires) => {
  const tree = global.dependenciesTree
  const cache = new Map() // name@spec -> in-flight promise
  const metas = new Map() // name@spec -> resolved metadata
  const pending = []
  const limit = pool(CONCURRENCY)
  let firstError = null

  // --- phase 1: fetch all metadata, concurrently (bounded) and de-duplicated ---
  const schedule = (name, spec) => {
    const key = metaKey(name, spec)
    if (cache.has(key)) return
    const p = limit(() => fetcher(name, spec))
      .then((meta) => {
        metas.set(key, meta)
        if (meta.dependencies) {
          for (const child of Object.keys(meta.dependencies)) {
            schedule(child, meta.dependencies[child])
          }
        }
      })
      .catch((e) => { if (!firstError) firstError = e })
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
    const queue = Object.keys(deps).map((name) => ({ dep: name, list: deps, base: [] }))
    const visited = new Set()

    while (queue.length) {
      const { dep, list, base } = queue.shift()
      const range = list[dep]

      // Already satisfied by the hoisted top-level copy.
      if (tree[dep] && tree[dep].version && semver.satisfies(tree[dep].version, range)) {
        continue
      }

      const meta = metas.get(metaKey(dep, range))
      if (!meta || !meta.version) continue

      // Skip identical (path, dep, version) work — guards against cycles and
      // redundant nesting.
      const mark = `${base.join('|')}|${dep}@${meta.version}`
      if (visited.has(mark)) continue
      visited.add(mark)

      const item = Object.assign({}, meta)
      if (keepRequires) item.requires = meta.dependencies
      delete item.dependencies
      // First (shallowest) occurrence hoists to the top; conflicts nest.
      if (!tree[dep]) tree[dep] = item
      else setter(tree, dep, item, base)

      if (!meta.dependencies) continue
      const id = `${dep}@${meta.version}`
      const childBase = base.length === 0 ? [id] : [...base, 'dependencies', id]
      for (const child of Object.keys(meta.dependencies)) {
        queue.push({ dep: child, list: meta.dependencies, base: childBase })
      }
    }
  }

  for (const name of Object.keys(deps)) schedule(name, deps[name])

  return drain().then(build)
}
