import fs from 'fs'
import path from 'path'

// Rebuild the installer tree from an npm v3 package-lock.json so `dep install`
// can reproduce a locked install without touching the registry.
//
// The lockfile encodes the tree through its location keys
// (`node_modules/a/node_modules/b`), which map directly onto the hoisted tree
// shape the installer consumes (top-level name->node, children under
// `.dependencies`). Returns the tree, or null when the lockfile is missing,
// not v3, or stale relative to the requested top-level deps.

const nodeFromEntry = (entry) => {
  const resolved = entry.resolved || ''
  const node = { version: entry.version, dependencies: {} }
  if (/^git\+/.test(resolved) || /\.git(#|$)/.test(resolved)) {
    node.type = 'git'
    node.url = resolved.replace(/^git\+/, '')
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

export default (cwd, topLevel) => {
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
        ref[name] = nodeFromEntry(entry)
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
