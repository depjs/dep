import path from 'path'
import fs from 'fs'
import resolver from './lock/resolver.js'
import locker from './lock/locker.js'
import parseOverrides from './utils/overrides.js'
import packument from './utils/packument.js'
import pool from './utils/pool.js'
import { CONCURRENCY } from './utils/resolve-tree.js'
import { findWorkspaces, resolveWorkspace } from './utils/workspaces.js'

global.dependenciesTree = {}

const allDeps = (json) => Object.assign(
  {},
  json.optionalDependencies || {},
  json.devDependencies || {},
  json.dependencies || {}
)

// Names that are optional (and not required by any non-optional field).
const optionalOf = (json) => {
  const required = new Set([
    ...Object.keys(json.dependencies || {}),
    ...Object.keys(json.devDependencies || {})
  ])
  return Object.keys(json.optionalDependencies || {}).filter((n) => !required.has(n))
}

// Seed the packument cache from an existing lockfile. Resolution discovers
// package names level by level (a package's deps are only known once its
// metadata arrives), so a fresh resolve costs tree-depth × RTT in sequential
// waves — the previous lock already names (nearly) every package the resolve
// will visit, so fetch their packuments immediately and collapse those waves
// into one. Purely a warm-up: the resolver still requests everything through
// the same memoised packument cache, so a stale lockfile only costs a wasted
// request, never a wrong result (failures here are swallowed for the same
// reason — the resolver surfaces its own errors).
const prefetch = () => {
  let lockJSON
  try {
    lockJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package-lock.json')))
  } catch (e) { return }
  const names = new Set()
  for (const [location, entry] of Object.entries(lockJSON.packages || {})) {
    const i = location.lastIndexOf('node_modules/')
    if (i === -1 || entry.link) continue
    // Aliased entries record the real package name; otherwise it's the path.
    names.add(entry.name || location.slice(i + 'node_modules/'.length))
  }
  const limit = pool(CONCURRENCY)
  for (const name of names) {
    limit(() => packument(name.replace('/', '%2f'), { full: true })).catch(() => {})
  }
}

const lock = (argv) => {
  argv._handled = true
  prefetch()
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))

  const allWorkspaces = pkgJSON.workspaces
    ? findWorkspaces(process.cwd(), pkgJSON.workspaces)
    : []

  // `-w <workspace>`: narrow the lockfile to the named workspace(s). Without
  // it, lock the root plus every workspace.
  const targets = argv.workspace || []
  const scoped = targets.length > 0
  const workspaces = scoped
    ? targets.map((target) => {
      const ws = resolveWorkspace(allWorkspaces, process.cwd(), target)
      if (!ws) {
        process.stderr.write(`No workspace found for "${target}"\n`)
        process.exit(1)
      }
      return ws
    })
    : allWorkspaces

  // The root's own deps are only locked when not scoping to specific workspaces.
  const deps = scoped ? {} : allDeps(pkgJSON)
  const optional = new Set(scoped ? [] : optionalOf(pkgJSON))

  // Lock each in-scope workspace's deps too, and link the workspace packages
  // themselves rather than fetching them from the registry.
  workspaces.forEach((ws) => {
    const wsDeps = allDeps(ws.pkg)
    Object.keys(wsDeps).forEach((name) => {
      if (!(name in deps)) deps[name] = wsDeps[name]
    })
    optionalOf(ws.pkg).forEach((name) => optional.add(name))
  })
  workspaces.forEach((ws) => { delete deps[ws.name] })
  // A name required by anyone isn't optional.
  Object.keys(deps).forEach((name) => {
    const requiredSomewhere = [pkgJSON, ...workspaces.map((ws) => ws.pkg)].some((j) =>
      (j.dependencies && j.dependencies[name]) || (j.devDependencies && j.devDependencies[name]))
    if (requiredSomewhere) optional.delete(name)
  })

  // When scoped, the root entry shouldn't declare deps we didn't resolve.
  const rootJSON = scoped
    ? { name: pkgJSON.name, version: pkgJSON.version, license: pkgJSON.license, workspaces: pkgJSON.workspaces }
    : pkgJSON

  const overrides = parseOverrides(pkgJSON.overrides, pkgJSON)
  const list = resolver(deps, optional, overrides)
  process.stdout.write('Resolving dependencies\n')
  Promise.all(list).then(() => {
    locker(rootJSON, global.dependenciesTree, workspaces)
    process.stdout.write(
      'created package-lock.json\n'
    )
  }).catch((e) => { process.stderr.write(e.stack) })
}

export default {
  command: 'lock',
  describe: 'Lock dependencies installed in node_modules',
  handler: lock,
  aliases: ['l']
}
