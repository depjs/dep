import semver from './semver.js'

// Resolve a dependency graph into the hoisted tree shape consumed by the
// installer and locker (a top-level name->node map, with conflicting versions
// nested under a parent's `.dependencies`).
//
// Two phases:
//   1. Fetch every reachable package's metadata in parallel, de-duplicated by
//      `name@spec` (and, for the registry, by packument). This is where the
//      time goes, so it runs fully concurrently and never fetches the same
//      thing twice.
//   2. Build the tree with a deterministic depth-first walk over the cached
//      metadata, so the output is identical on every run regardless of network
//      timing.

const getter = (list, keys) => {
  let ref = list
  while (keys.length) {
    const key = keys.shift()
    if (key in ref) {
      ref = ref[key]
    } else {
      return
    }
  }
  return ref
}

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
  let firstError = null

  // --- phase 1: fetch all metadata, concurrently and de-duplicated ---
  const schedule = (name, spec) => {
    const key = metaKey(name, spec)
    if (cache.has(key)) return
    const p = fetcher(name, spec)
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

  // --- phase 2: build the hoisted tree deterministically ---
  const place = (dep, list, base, path) => {
    const range = list[dep]
    if (tree[dep] && tree[dep].version && semver.satisfies(tree[dep].version, range)) {
      return
    }
    for (let i = 0; i < base.length; i += 2) {
      const target = getter(tree, base.slice(0, i))
      if (target && target[dep] && target[dep].version &&
          semver.satisfies(target[dep].version, range)) {
        return
      }
    }

    const meta = metas.get(metaKey(dep, range))
    if (!meta || !meta.version) return
    const id = `${dep}@${meta.version}`
    if (path.has(id)) return // guard against dependency cycles

    const item = Object.assign({}, meta)
    if (keepRequires) item.requires = meta.dependencies
    delete item.dependencies
    if (!tree[dep]) tree[dep] = item
    else setter(tree, dep, item, base)

    if (!meta.dependencies) return
    const newBase = base.length === 0
      ? [id]
      : [...base, 'dependencies', id]
    path.add(id)
    for (const child of Object.keys(meta.dependencies)) {
      place(child, meta.dependencies, newBase, path)
    }
    path.delete(id)
  }

  for (const name of Object.keys(deps)) schedule(name, deps[name])

  return drain().then(() => {
    for (const name of Object.keys(deps)) place(name, deps, [], new Set())
  })
}
