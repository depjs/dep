import path from 'path'
import fs from 'fs'
import resolver from './install/resolver.js'
import installer from './install/installer.js'
import saver from './install/saver.js'
import nodeGyp from './utils/node-gyp.js'
import nm from './utils/nm.js'
import npa from './utils/npa.js'
import bin from './install/installer/bin.js'
import { findWorkspaces, resolveWorkspace } from './utils/workspaces.js'
import dropPrivilege from './utils/drop-privilege.js'

const isWin = process.platform === 'win32'

// Symlink each workspace package into the root node_modules so cross-workspace
// imports resolve, and link its bins into node_modules/.bin.
const linkWorkspaces = (workspaces) => Promise.all(workspaces.map(async (ws) => {
  const dest = path.join(nm, ws.name)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.rmSync(dest, { recursive: true, force: true })
  const target = isWin ? ws.dir : path.relative(path.dirname(dest), ws.dir)
  fs.symlinkSync(target, dest, isWin ? 'junction' : 'dir')
  await bin(ws.name, ws.dir)
}))

global.dependenciesCount = 0
global.dependenciesTree = {}
global.nativeBuildQueue = []
global.time = process.hrtime()

const install = (argv) => {
  argv._handled = true
  const pkgs = argv._.length > 1 ? argv._.slice(1) : []
  const only = argv.only === 'dev' || argv.only === 'prod' ? argv.only : 'all'
  const save = argv.save === 'dev' || argv.save === 'prod' ? argv.save : null
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
  const allDependencies = {
    all: [
      'dependencies',
      'devDependencies'
    ],
    prod: [
      'dependencies'
    ],
    dev: [
      'devDependencies'
    ]
  }
  // Collect a package.json's deps honouring the --only filter (optional deps
  // are always included, like npm).
  const collect = (json) => {
    const out = Object.assign({}, json.optionalDependencies || {})
    allDependencies[only].forEach((key) => {
      if (json[key]) Object.assign(out, json[key])
    })
    return out
  }

  const deps = collect(pkgJSON)

  // Workspaces: merge every workspace's deps into the root install and link the
  // workspace packages themselves rather than fetching them from the registry.
  const workspaces = pkgJSON.workspaces
    ? findWorkspaces(process.cwd(), pkgJSON.workspaces)
    : []
  workspaces.forEach((ws) => {
    const wsDeps = collect(ws.pkg)
    Object.keys(wsDeps).forEach((name) => {
      if (!(name in deps)) deps[name] = wsDeps[name]
    })
  })
  workspaces.forEach((ws) => { delete deps[ws.name] })

  // `-w <workspace>`: the named package(s) belong to those workspaces. Resolve
  // each target up front so a typo fails before we touch anything.
  const wsTargets = (argv.workspace || []).map((target) => {
    const ws = resolveWorkspace(workspaces, process.cwd(), target)
    if (!ws) {
      process.stderr.write(`No workspace found for "${target}"\n`)
      process.exit(1)
    }
    return ws
  })

  pkgs.forEach((pkg) => {
    // Use npa to split the name from the spec so scoped packages
    // (@scope/name@range) aren't broken by the leading '@'.
    const { name } = npa(pkg, process.cwd())
    deps[name] = pkg.slice(name.length + 1)
  })
  const list = resolver(deps)
  process.stdout.write('Resolving dependencies\n')
  fs.rmSync(nm, { recursive: true, force: true })
  Promise.all(list).then(() => {
    dropPrivilege() // if root
    const tasks = installer(global.dependenciesTree)
    process.stdout.write('Installing dependencies\n')
    Promise.all(tasks).then(async () => {
      // `-w` implies saving into the target workspace(s); otherwise honour
      // --save against the root package.json.
      if (wsTargets.length && pkgs.length) {
        wsTargets.forEach((ws) => saver(pkgs, save, ws.dir))
      } else if (save) {
        saver(pkgs, save)
      }
      global.nativeBuildQueue.forEach((cwd) => {
        try {
          process.stdout.write('Building dependencies\n')
          nodeGyp({ cwd })
        } catch (e) {
          // remove the pkg since the deps could be optional
          fs.rmSync(cwd, { recursive: true, force: true })
        }
      })
      if (workspaces.length) {
        process.stdout.write('Linking workspaces\n')
        await linkWorkspaces(workspaces)
      }
      const duration = process.hrtime(global.time)
      const time = duration[0] + duration[1] / 1e9
      const s = Math.round(time * 1000) / 1000
      process.stdout.write(
        `Installed ${global.dependenciesCount} packages in ${s}s\n`
      )
    }).catch((e) => { process.stderr.write(e.stack) })
  }).catch((e) => { process.stderr.write(e.stack) })
}

export default {
  command: 'install',
  describe: 'Install dependencies defined in package.json',
  handler: install,
  aliases: ['i']
}
