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
    const entry = { version: node.version }
    const resolved = node.tarball || node.url
    if (resolved) entry.resolved = resolved
    const integrity = toIntegrity(node)
    if (integrity) entry.integrity = integrity
    if (node.hasInstallScript) entry.hasInstallScript = true
    if (node.license) entry.license = node.license
    if (node.engines) entry.engines = node.engines
    if (node.os) entry.os = node.os
    if (node.cpu) entry.cpu = node.cpu
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

// Mark every location reachable from a set of root dependency names.
const reachable = (packages, roots) => {
  const seen = {}
  const stack = roots
    .map((name) => resolveFrom(packages, '', name))
    .filter(Boolean)
  while (stack.length) {
    const location = stack.pop()
    if (seen[location]) continue
    seen[location] = true
    const entry = packages[location]
    const edges = Object.assign({}, entry.dependencies, entry.optionalDependencies)
    Object.keys(edges).forEach((name) => {
      const child = resolveFrom(packages, location, name)
      if (child) stack.push(child)
    })
  }
  return seen
}

const locker = (pkgJSON, tree) => {
  const packages = {}

  const root = { name: pkgJSON.name, version: pkgJSON.version }
  if (pkgJSON.license) root.license = pkgJSON.license
  if (notEmpty(pkgJSON.dependencies)) root.dependencies = pkgJSON.dependencies
  if (notEmpty(pkgJSON.devDependencies)) root.devDependencies = pkgJSON.devDependencies
  if (notEmpty(pkgJSON.optionalDependencies)) root.optionalDependencies = pkgJSON.optionalDependencies
  packages[''] = root

  flatten(tree, '', packages)

  // Classify each package as production, dev and/or optional so the lockfile
  // mirrors npm's `dev`/`optional`/`devOptional` annotations.
  const inProd = reachable(packages, Object.keys(pkgJSON.dependencies || {}))
  const inDev = reachable(packages, Object.keys(pkgJSON.devDependencies || {}))
  const inOptional = reachable(packages, Object.keys(pkgJSON.optionalDependencies || {}))
  Object.keys(packages).forEach((location) => {
    if (location === '') return
    if (inProd[location]) return
    if (inDev[location] && inOptional[location]) packages[location].devOptional = true
    else if (inOptional[location]) packages[location].optional = true
    else if (inDev[location]) packages[location].dev = true
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
