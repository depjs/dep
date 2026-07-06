import { writeFileSync } from 'fs'
import path from 'path'

const pkgLockJSON = path.join(process.cwd(), 'package-lock.json')

// Subresource Integrity string for a resolved node. Prefer the registry's
// `integrity` (sha512); fall back to converting a legacy `shasum` (hex sha1).
const toIntegrity = (node) => {
  if (node.integrity) return node.integrity
  if (node.shasum) return 'sha1-' + Buffer.from(node.shasum, 'hex').toString('base64')
  return undefined
}

const notEmpty = (obj) => obj && Object.keys(obj).length > 0

// Flatten the hoisted resolver tree into npm's `packages` map, keyed by the
// install location (`node_modules/...`, nested for de-duplicated conflicts).
const flatten = (tree, prefix, packages) => {
  Object.keys(tree).forEach((name) => {
    const node = tree[name]
    const location = prefix + 'node_modules/' + name
    const entry = {}
    // Aliases (`foo: npm:bar`) record the real package name, which differs from
    // the install location.
    if (node.name && node.name !== name) entry.name = node.name
    entry.version = node.version
    const resolved = node.tarball || node.url
    if (resolved) entry.resolved = resolved
    const integrity = toIntegrity(node)
    if (integrity) entry.integrity = integrity
    if (node.hasInstallScript) entry.hasInstallScript = true
    if (node.license) entry.license = node.license
    if (node.engines) entry.engines = node.engines
    if (node.os) entry.os = node.os
    if (node.cpu) entry.cpu = node.cpu
    if (node.libc) entry.libc = node.libc
    if (node.bin) entry.bin = node.bin
    if (notEmpty(node.requires)) entry.dependencies = node.requires
    if (notEmpty(node.optionalDependencies)) entry.optionalDependencies = node.optionalDependencies
    if (notEmpty(node.peerDependencies)) entry.peerDependencies = node.peerDependencies
    if (node.funding) entry.funding = node.funding
    packages[location] = entry
    if (node.dependencies) flatten(node.dependencies, location + '/', packages)
  })
  return packages
}

// Resolve `name` from `fromPath` by climbing the node_modules chain, the same
// way Node resolves requires, and return the matching location (or null).
const resolveFrom = (packages, fromPath, name) => {
  let base = fromPath
  while (true) {
    const candidate = (base ? base + '/' : '') + 'node_modules/' + name
    if (packages[candidate]) return candidate
    if (!base) return null
    const idx = base.lastIndexOf('/node_modules/')
    base = idx === -1 ? '' : base.slice(0, idx)
  }
}

// Mark every location reachable from a set of root dependency names. A
// workspace link is followed to its source entry, so the workspace's own
// dependencies are traversed too. `withOptional` also follows
// optionalDependencies edges; comparing a strict pass with an optional one
// tells which packages are reachable only through an optional edge.
const reachable = (packages, roots, withOptional) => {
  const seen = {}
  const stack = roots
    .map((name) => resolveFrom(packages, '', name))
    .filter(Boolean)
  while (stack.length) {
    const location = stack.pop()
    if (seen[location]) continue
    seen[location] = true
    let entry = packages[location]
    let base = location
    if (entry && entry.link) {
      base = entry.resolved
      entry = packages[entry.resolved]
    }
    if (!entry) continue
    const edges = withOptional
      ? Object.assign({}, entry.dependencies, entry.optionalDependencies)
      : Object.assign({}, entry.dependencies)
    Object.keys(edges).forEach((name) => {
      const child = resolveFrom(packages, base, name)
      if (child) stack.push(child)
    })
  }
  return seen
}

const locker = (pkgJSON, tree, workspaces = []) => {
  const packages = {}

  const root = { name: pkgJSON.name, version: pkgJSON.version }
  if (pkgJSON.license) root.license = pkgJSON.license
  if (pkgJSON.workspaces) root.workspaces = pkgJSON.workspaces
  if (notEmpty(pkgJSON.dependencies)) root.dependencies = pkgJSON.dependencies
  if (notEmpty(pkgJSON.devDependencies)) root.devDependencies = pkgJSON.devDependencies
  if (notEmpty(pkgJSON.optionalDependencies)) root.optionalDependencies = pkgJSON.optionalDependencies
  packages[''] = root

  flatten(tree, '', packages)

  // Each workspace appears twice, npm-style: a source entry at its real
  // location, and a `link: true` entry in node_modules pointing at it.
  workspaces.forEach((ws) => {
    const location = path.relative(process.cwd(), ws.dir).split(path.sep).join('/')
    const src = { name: ws.pkg.name, version: ws.pkg.version }
    if (ws.pkg.license) src.license = ws.pkg.license
    if (notEmpty(ws.pkg.dependencies)) src.dependencies = ws.pkg.dependencies
    if (notEmpty(ws.pkg.devDependencies)) src.devDependencies = ws.pkg.devDependencies
    if (notEmpty(ws.pkg.optionalDependencies)) src.optionalDependencies = ws.pkg.optionalDependencies
    if (notEmpty(ws.pkg.peerDependencies)) src.peerDependencies = ws.pkg.peerDependencies
    if (ws.pkg.bin) src.bin = ws.pkg.bin
    if (ws.pkg.engines) src.engines = ws.pkg.engines
    packages[location] = src
    packages['node_modules/' + ws.name] = { resolved: location, link: true }
  })

  // Classify each package as production, dev and/or optional so the lockfile
  // mirrors npm's `dev`/`optional`/`devOptional` annotations. Workspaces (and
  // the deps reached through their links) count as production.
  const wsDevNames = workspaces.flatMap((ws) => Object.keys(ws.pkg.devDependencies || {}))
  const wsOptNames = workspaces.flatMap((ws) => Object.keys(ws.pkg.optionalDependencies || {}))
  const prodRoots = [...Object.keys(pkgJSON.dependencies || {}), ...workspaces.map((ws) => ws.name)]
  const devRoots = [...Object.keys(pkgJSON.devDependencies || {}), ...wsDevNames]
  const optRoots = [...Object.keys(pkgJSON.optionalDependencies || {}), ...wsOptNames]

  // Strictly-required reachability (real dependencies only) vs. reachability
  // that also follows optional edges. A package reached only through an
  // optional edge is `optional`.
  const inProd = reachable(packages, prodRoots, false)
  const inDev = reachable(packages, devRoots, false)
  const prodOptional = reachable(packages, [...prodRoots, ...optRoots], true)
  const devOptional = reachable(packages, devRoots, true)
  Object.keys(packages).forEach((location) => {
    if (location === '') return
    if (inProd[location]) return
    if (inDev[location]) { packages[location].dev = true; return }
    if (prodOptional[location] && devOptional[location]) packages[location].devOptional = true
    else if (prodOptional[location]) packages[location].optional = true
    else if (devOptional[location]) packages[location].devOptional = true
  })

  const sorted = {}
  Object.keys(packages).sort().forEach((location) => {
    sorted[location] = packages[location]
  })

  const lock = {
    name: pkgJSON.name,
    version: pkgJSON.version,
    lockfileVersion: 3,
    requires: true,
    packages: sorted
  }

  writeFileSync(pkgLockJSON, JSON.stringify(lock, null, 2) + '\n')
}

export default locker
