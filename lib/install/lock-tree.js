import fs from 'fs'
import path from 'path'
import semver from '../utils/semver.js'

// Rebuild the installer tree from an npm v3 package-lock.json so `dep install`
// can reproduce a locked install without touching the registry.
//
// The lockfile encodes the tree through its location keys
// (`node_modules/a/node_modules/b`), which map directly onto the hoisted tree
// shape the installer consumes (top-level name->node, children under
// `.dependencies`). Returns the tree, or null when the lockfile is missing,
// not v3, or stale relative to the requested top-level deps.

const nodeFromEntry = (entry, cwd) => {
  const resolved = entry.resolved || ''
  const node = { version: entry.version, dependencies: {} }
  if (/^git\+/.test(resolved) || /\.git(#|$)/.test(resolved)) {
    node.type = 'git'
    node.url = resolved.replace(/^git\+/, '')
  } else if (resolved && !/^[a-z][a-z0-9+.-]*:\/\//i.test(resolved)) {
    // No URL scheme — a filesystem path, i.e. a local dependency (dep records
    // these absolute; npm relative to the project): a tarball to extract, or
    // a directory to copy. `bin`/`hasInstallScript` stay undefined so the
    // installer reads them from the installed package.json.
    node.type = /\.(tgz|tar\.gz|tar)$/i.test(resolved) ? 'file' : 'local'
    node.url = path.resolve(cwd, resolved)
  } else {
    // registry and remote tarballs are fetched and extracted identically.
    node.type = 'registry'
    node.tarball = resolved
    // v3 lockfiles (npm's and dep's alike) record each package's bins and
    // whether it has install scripts, so the installer can skip re-reading
    // every extracted package.json.
    node.bin = entry.bin || null
    node.hasInstallScript = !!entry.hasInstallScript
  }
  if (entry.integrity) node.integrity = entry.integrity
  // npm-style annotation for packages reachable only through optional edges;
  // the installer uses it to decide if a failed native build is skippable.
  if (entry.optional || entry.devOptional) node.optional = true
  return node
}

// The lock predates a change to the root `overrides` if some overridden name
// resolves entirely outside every rule for it — a lock written with the rules
// in effect always keeps at least one satisfying copy. Checked per name, and
// loosely (any copy satisfying any rule for that name accepts the lock), so a
// nested rule coexisting with legitimately un-overridden copies elsewhere in
// the tree doesn't invalidate the lockfile forever.
const violatesOverrides = (packages, rules) => {
  const specs = new Map() // name -> [version spec, ...] from every rule depth
  const collect = (map) => {
    for (const [name, rule] of map) {
      if (rule.version && semver.validRange(rule.version)) {
        if (!specs.has(name)) specs.set(name, [])
        specs.get(name).push(rule.version)
      }
      if (rule.children) collect(rule.children)
    }
  }
  collect(rules)
  for (const [name, list] of specs) {
    let seen = false
    let satisfied = false
    for (const location of Object.keys(packages)) {
      const entry = packages[location]
      const i = location.lastIndexOf('node_modules/')
      if (i === -1 || !entry.version) continue
      if ((entry.name || location.slice(i + 'node_modules/'.length)) !== name) continue
      seen = true
      if (list.some((spec) => semver.satisfies(entry.version, spec))) {
        satisfied = true
        break
      }
    }
    if (seen && !satisfied) return true
  }
  return false
}

export default (cwd, topLevel, overrides) => {
  let lock
  try {
    lock = JSON.parse(fs.readFileSync(path.join(cwd, 'package-lock.json')))
  } catch (e) {
    return null
  }
  if (!lock || lock.lockfileVersion !== 3 || !lock.packages) return null

  // If a requested top-level dep isn't locked, the lockfile is stale; bail out
  // so the caller re-resolves from package.json instead.
  for (const name of topLevel) {
    if (!lock.packages['node_modules/' + name]) return null
  }

  // Same when the lock predates the current overrides: reproducing it would
  // silently ignore them.
  if (overrides && overrides.size && violatesOverrides(lock.packages, overrides)) {
    return null
  }

  // Locations nested below a `link: true` entry belong to the link's source
  // tree, not to node_modules: the link itself is only symlinked after the
  // install, so anything placed there would be deleted (or written through
  // the symlink into the source). npm nests a workspace's conflicting deps
  // this way, e.g. `node_modules/<ws>/node_modules/<dep>`.
  const links = Object.keys(lock.packages)
    .filter((location) => lock.packages[location].link)
    .map((location) => location + '/')

  const tree = {}
  for (const location of Object.keys(lock.packages)) {
    const entry = lock.packages[location]
    if (location === '') continue // root
    if (entry.link) continue // workspace link (symlinked separately)
    if (!location.startsWith('node_modules/')) continue // workspace source
    if (links.some((link) => location.startsWith(link))) continue // nested under a link

    const segments = location.replace(/^node_modules\//, '').split('/node_modules/')
    let ref = tree
    segments.forEach((name, i) => {
      if (i === segments.length - 1) {
        const children = ref[name] && ref[name].dependencies
        ref[name] = nodeFromEntry(entry, cwd)
        if (children) ref[name].dependencies = children
      } else {
        if (!ref[name]) ref[name] = { dependencies: {} }
        if (!ref[name].dependencies) ref[name].dependencies = {}
        ref = ref[name].dependencies
      }
    })
  }

  // A nested location whose parent never got an entry of its own leaves a
  // typeless placeholder the installer cannot fetch; drop such subtrees.
  const prune = (nodes) => {
    for (const name of Object.keys(nodes)) {
      if (!nodes[name].type) delete nodes[name]
      else prune(nodes[name].dependencies || {})
    }
  }
  prune(tree)

  return tree
}
