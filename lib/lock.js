import path from 'path'
import fs from 'fs'
import resolver from './lock/resolver.js'
import locker from './lock/locker.js'
import parseOverrides from './utils/overrides.js'
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

const lock = (argv) => {
  argv._handled = true
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
