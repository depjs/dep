import path from 'path'
import fs from 'fs'
import resolver from './install/resolver.js'
import installer from './install/installer.js'
import { abortPrefetch, cleanupStaging } from './install/prefetch.js'
import saver from './install/saver.js'
import lockTree from './install/lock-tree.js'
import nodeGyp from './utils/node-gyp.js'
import nm from './utils/nm.js'
import npa from './utils/npa.js'
import bin from './install/installer/bin.js'
import lifecycle from './utils/lifecycle.js'
import parseOverrides from './utils/overrides.js'
import { findWorkspaces, resolveWorkspace } from './utils/workspaces.js'
import dropPrivilege from './utils/drop-privilege.js'

const isWin = process.platform === 'win32'

// The local project's lifecycle scripts, in npm's order: `preinstall` runs
// before dependencies are installed, the rest after.
const PREINSTALL = ['preinstall']
const POSTINSTALL = ['install', 'postinstall', 'prepublish', 'preprepare', 'prepare', 'postprepare']

// Run a set of lifecycle scripts for the root project and each workspace.
const runLifecycle = async (dirs, names) => {
  let ran = false
  for (const dir of dirs) {
    if (await lifecycle(dir, names)) ran = true
  }
  return ran
}

// Symlink each workspace package into the root node_modules so cross-workspace
// imports resolve, and link its bins into node_modules/.bin.
const linkWorkspaces = (workspaces) => Promise.all(workspaces.map(async (ws) => {
  const dest = path.join(nm, ws.name)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.rmSync(dest, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  const target = isWin ? ws.dir : path.relative(path.dirname(dest), ws.dir)
  fs.symlinkSync(target, dest, isWin ? 'junction' : 'dir')
  await bin(ws.name, ws.dir)
}))

global.dependenciesCount = 0
global.dependenciesTree = {}
global.nativeBuildQueue = []
global.lifecycleQueue = []
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
  // Track which requested names are optional (so they can be skipped on
  // failure / platform mismatch). A name required anywhere is never optional.
  const optionalNames = new Set()
  const requiredNames = new Set()

  // Collect a package.json's deps honouring the --only filter (optional deps
  // are always included, like npm).
  const collect = (json) => {
    const out = {}
    Object.keys(json.optionalDependencies || {}).forEach((name) => {
      out[name] = json.optionalDependencies[name]
      optionalNames.add(name)
    })
    allDependencies[only].forEach((key) => {
      Object.keys(json[key] || {}).forEach((name) => {
        // optionalDependencies entries override same-named dependencies
        // entries (npm semantics) — the name stays optional.
        if (name in (json.optionalDependencies || {})) return
        out[name] = json[key][name]
        requiredNames.add(name)
      })
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
    requiredNames.add(name)
  })

  // A name is optional only if nothing requires it.
  const optional = new Set([...optionalNames].filter((name) => !requiredNames.has(name)))

  // Only the root project's `overrides` apply (npm semantics).
  const overrides = parseOverrides(pkgJSON.overrides, pkgJSON)

  // Reproduce the locked install when nothing forces a fresh resolve: a plain
  // `dep install` (no package args, no `-w`, no `--only` filter) with a
  // package-lock.json that still covers every requested dependency.
  let locked = null
  if (pkgs.length === 0 && wsTargets.length === 0 && only === 'all') {
    try {
      locked = lockTree(process.cwd(), Object.keys(deps), overrides)
    } catch (e) {
      return fail(e) // a locked required dep cannot run on this platform
    }
  }

  let list
  if (locked) {
    global.dependenciesTree = locked
    list = []
    process.stdout.write('Using package-lock.json\n')
  } else {
    list = resolver(deps, optional, overrides)
    process.stdout.write('Resolving dependencies\n')
  }
  // The local project and each workspace get their own lifecycle scripts run,
  // matching `npm install`.
  const localDirs = [process.cwd(), ...workspaces.map((ws) => ws.dir)]

  // Get the old node_modules out of the way instantly (rename), then delete
  // it in the background while resolution and downloads run: removing a large
  // tree synchronously here blocks the event loop and stalls the in-flight
  // metadata fetches. Falls back to a synchronous wipe where the rename is
  // not possible (e.g. open handles on Windows).
  const trash = nm + '.dep-delete'
  let wipe = Promise.resolve()
  try {
    fs.rmSync(trash, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    fs.renameSync(nm, trash)
    wipe = fs.promises.rm(trash, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  } catch (e) {
    if (e.code !== 'ENOENT') {
      fs.rmSync(nm, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    }
  }
  Promise.all(list).then(async () => {
    dropPrivilege() // if root
    // `preinstall` runs before dependencies are installed.
    await runLifecycle(localDirs, PREINSTALL)
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
      global.nativeBuildQueue.forEach(({ cwd, optional }) => {
        try {
          process.stdout.write('Building dependencies\n')
          nodeGyp({ cwd })
        } catch (e) {
          // An optional dependency that fails to build is removed and skipped,
          // silently — the same quiet treatment npm gives it. A required one
          // is a broken install: fail now rather than at require() time.
          if (!optional) {
            const detail = (e.stderr && String(e.stderr).trim()) || e.message
            const name = cwd.split(/node_modules[\\/]/).pop().replaceAll('\\', '/')
            throw new Error(`Native build failed for ${name}\n${detail}`)
          }
          fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
        }
      })
      if (workspaces.length) {
        process.stdout.write('Linking workspaces\n')
        await linkWorkspaces(workspaces)
      }
      // Dependencies' own `preinstall`/`install`/`postinstall` scripts run only
      // now that the entire tree is extracted, bins are linked and native
      // addons are built — deepest packages first, so a package's dependencies
      // are in place before its scripts run (npm's leaf-first order).
      const lifecycleQueue = global.lifecycleQueue.sort((a, b) => b.length - a.length)
      for (const cwd of lifecycleQueue) {
        await lifecycle(cwd, ['preinstall', 'install', 'postinstall'])
      }
      // `install`/`postinstall`/`prepublish`/`prepare` run after dependencies
      // (and bins) are in place — matching `npm install`.
      await runLifecycle(localDirs, POSTINSTALL)
      await cleanupStaging() // drop prefetched tarballs nothing consumed
      await wipe // surface a failed background delete of the old tree
      const duration = process.hrtime(global.time)
      const time = duration[0] + duration[1] / 1e9
      const s = Math.round(time * 1000) / 1000
      process.stdout.write(
        `Installed ${global.dependenciesCount} packages in ${s}s\n`
      )
    }).catch(fail)
  }).catch(fail)
}

// Report an install failure and exit non-zero (e.g. a failed integrity check).
// In-flight prefetch downloads are aborted so the process doesn't linger
// finishing work nobody will use; their staging leftovers are wiped by the
// next install.
const fail = (e) => {
  abortPrefetch()
  process.stderr.write((e && e.stack ? e.stack : String(e)) + '\n')
  process.exitCode = 1
}

export default {
  command: 'install',
  describe: 'Install dependencies defined in package.json',
  handler: install,
  aliases: ['i']
}
