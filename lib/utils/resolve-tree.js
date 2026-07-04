import semver from './semver.js'
import pool from './pool.js'

// Metadata fetches are small JSON documents, so resolution can run far wider
// than tarball downloads/extractions (which stay on DEP_CONCURRENCY) without
// saturating sockets or disk. DEP_RESOLVE_CONCURRENCY overrides; an explicit
// DEP_CONCURRENCY still throttles both phases.
const CONCURRENCY = Math.max(1,
  Number(process.env.DEP_RESOLVE_CONCURRENCY) ||
  Number(process.env.DEP_CONCURRENCY) || 64)

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

// The semver range to compare a resolved version against. For an alias spec
// (`npm:other@range`) that's the target's range; otherwise the spec itself.
const semverRange = (spec) => {
  if (typeof spec === 'string' && spec.startsWith('npm:')) {
    const at = spec.lastIndexOf('@')
    return at > 'npm:'.length ? spec.slice(at + 1) : '*'
  }
  return spec
}

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
// bundledDependencies are excluded — they ship inside the package's tarball and
// must not be re-fetched or hoisted.
const edgesOf = (meta) => {
  const bundled = new Set(meta.bundled || [])
  const out = []
  const deps = meta.dependencies || {}
  for (const name of Object.keys(deps)) {
    if (bundled.has(name)) continue
    out.push({ name, range: deps[name], optional: false })
  }

  const peerInfo = meta.peerDependenciesMeta || {}
  const peers = meta.peerDependencies || {}
  for (const name of Object.keys(peers)) {
    if (name in deps || bundled.has(name)) continue
    if (peerInfo[name] && peerInfo[name].optional) continue
    out.push({ name, range: peers[name], optional: false })
  }

  const optionals = meta.optionalDependencies || {}
  for (const name of Object.keys(optionals)) {
    if (name in deps || bundled.has(name)) continue
    out.push({ name, range: optionals[name], optional: true })
  }
  return out
}

export default (deps, fetcher, opts = {}) => {
  const {
    keepRequires = false,
    optional: optionalRoots = new Set(),
    skipPlatform = false,
    checkEngines = false,
    engineStrict = false,
    overrides = new Map()
  } = opts

  // Overrides are a tree of rules; `scope` is the stack of rule maps in effect
  // (the root rules plus any nested `parent>child` maps entered along the path).
  // The deepest (most specific) match wins.
  const rootScope = [overrides]
  const matchRule = (name, scope) => {
    for (let i = scope.length - 1; i >= 0; i--) {
      if (scope[i].has(name)) return scope[i].get(name)
    }
    return null
  }
  const effSpec = (name, spec, scope) => {
    const rule = matchRule(name, scope)
    return rule && rule.version ? rule.version : spec
  }
  const childScope = (name, scope) => {
    const rule = matchRule(name, scope)
    return rule && rule.children ? [...scope, rule.children] : scope
  }
  // Two placements of the same name@spec are distinct only when their nested
  // override scope differs (so their subtrees resolve differently).
  const cacheKey = (name, spec, scope) =>
    metaKey(name, spec) + (scope.length > 1 ? '#' + scope.slice(1).map((m) => [...m.keys()].join(',')).join('|') : '')

  const tree = global.dependenciesTree
  const cache = new Map() // key -> in-flight promise
  const metas = new Map() // key -> resolved metadata
  const required = new Set() // key reached through a non-optional edge
  const pending = []
  const limit = pool(CONCURRENCY)
  let firstError = null

  // --- phase 1: fetch all metadata, concurrently (bounded) and de-duplicated ---
  const schedule = (name, spec, optional, scope) => {
    spec = effSpec(name, spec, scope)
    const cscope = childScope(name, scope)
    const key = cacheKey(name, spec, cscope)
    if (!optional) required.add(key)
    if (cache.has(key)) return
    const p = limit(() => fetcher(name, spec))
      .then((meta) => {
        metas.set(key, meta)
        for (const e of edgesOf(meta)) schedule(e.name, e.range, optional || e.optional, cscope)
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
  const platformErrors = []
  const engineErrors = []
  const build = () => {
    const queue = Object.keys(deps).map((name) => ({
      name, range: deps[name], base: [], optional: optionalRoots.has(name), scope: rootScope
    }))
    const visited = new Set()

    while (queue.length) {
      const item0 = queue.shift()
      const { name, base, optional, scope } = item0
      const range = effSpec(name, item0.range, scope)
      const cscope = childScope(name, scope)

      // Already satisfied by the hoisted top-level copy.
      if (tree[name] && tree[name].version && semver.satisfies(tree[name].version, semverRange(range))) {
        continue
      }

      const meta = metas.get(cacheKey(name, range, cscope))
      if (!meta || !meta.version) continue // optional that failed to resolve

      const id = `${name}@${meta.version}`

      // Platform check (install only; the lockfile keeps every platform's deps).
      if (skipPlatform && !matchesPlatform(meta)) {
        // Optional deps for another platform are simply skipped; a required one
        // that can't run here is an error.
        if (!optional) {
          platformErrors.push(`${id} (os ${JSON.stringify(meta.os || ['any'])}, cpu ${JSON.stringify(meta.cpu || ['any'])})`)
        }
        continue
      }

      // Engine check: warn by default, collect an error under engine-strict.
      if (checkEngines && meta.engines && meta.engines.node &&
          !semver.satisfies(process.version, meta.engines.node)) {
        const msg = `${id} requires node ${meta.engines.node} (current ${process.version})`
        if (engineStrict) engineErrors.push(msg)
        else process.stderr.write(`warning: ${msg}\n`)
      }

      // Skip identical (path, dep, version, override-scope) work — guards
      // against cycles and redundant nesting.
      const mark = `${base.join('|')}|${cacheKey(name, range, cscope)}`
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
      const childBase = base.length === 0 ? [id] : [...base, 'dependencies', id]
      for (const e of edges) {
        queue.push({ name: e.name, range: e.range, base: childBase, optional: optional || e.optional, scope: cscope })
      }
    }

    if (platformErrors.length) {
      throw new Error('Unsupported platform for:\n  ' + platformErrors.join('\n  '))
    }
    if (engineErrors.length) {
      throw new Error('Unsupported engine for:\n  ' + engineErrors.join('\n  '))
    }
  }

  for (const name of Object.keys(deps)) schedule(name, deps[name], optionalRoots.has(name), rootScope)

  return drain().then(build)
}
