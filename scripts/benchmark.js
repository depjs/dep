// Install benchmark: npm vs yarn vs pnpm vs dep, in two scenarios.
//
//   cold  — fresh project, no lockfile, fresh isolated cache for every run.
//   warm  — lockfile present and cache/store warm; only node_modules is removed
//           before each run (the usual reinstall / cached-CI case).
//
// yarn is pinned to the node-modules linker so all four produce a comparable
// node_modules. Lower is better.
//
// Usage: node scripts/benchmark.js   (RUNS=5 by default; set RUNS to change)
import { execSync } from 'child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const RUNS = Number(process.env.RUNS) || 5
const depBin = fileURLToPath(new URL('../bin/dep.js', import.meta.url))

const pkg = JSON.stringify({
  name: 'bench',
  version: '1.0.0',
  private: true,
  dependencies: {
    express: '^4.19.0',
    lodash: '^4.17.21',
    chalk: '^5.3.0',
    commander: '^12.0.0',
    chokidar: '^3.6.0',
    rxjs: '^7.8.0',
    debug: '^4.3.4',
    semver: '^7.6.0',
    'cross-spawn': '^7.0.3',
    glob: '^10.3.0',
    yargs: '^17.7.0',
    axios: '^1.7.0'
  }
})

const tools = [
  {
    name: 'npm',
    env: (cache) => ({ npm_config_cache: cache }),
    cold: 'npm install --no-audit --no-fund --no-package-lock',
    warmSetup: 'npm install --no-audit --no-fund',
    warm: 'npm ci --no-audit --no-fund'
  },
  {
    name: 'yarn',
    env: (cache) => ({ YARN_ENABLE_GLOBAL_CACHE: 'false', YARN_NODE_LINKER: 'node-modules', YARN_CACHE_FOLDER: cache }),
    cold: 'yarn install --no-immutable',
    warmSetup: 'yarn install --no-immutable',
    warm: 'yarn install --immutable'
  },
  {
    name: 'pnpm',
    env: (cache) => ({ npm_config_cache: cache }),
    cold: (cache) => `pnpm install --no-lockfile --store-dir ${path.join(cache, 'store')}`,
    warmSetup: (cache) => `pnpm install --store-dir ${path.join(cache, 'store')}`,
    warm: (cache) => `pnpm install --frozen-lockfile --store-dir ${path.join(cache, 'store')}`
  },
  {
    name: 'dep',
    env: () => ({ NO_UPDATE_NOTIFIER: '1' }),
    cold: `node ${depBin} install`,
    warmSetup: `node ${depBin} lock`,
    warm: `node ${depBin} install`
  }
]

const installed = (name) => {
  try {
    execSync(`${name} --version`, { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

const resolve = (cmd, cache) => (typeof cmd === 'function' ? cmd(cache) : cmd)

const time = (cmd, opts) => {
  const start = process.hrtime.bigint()
  execSync(cmd, opts)
  return Number(process.hrtime.bigint() - start) / 1e9
}

// cold: a fresh project + fresh cache for every run.
const cold = (tool) => {
  let total = 0
  let best = Infinity
  for (let i = 0; i < RUNS; i++) {
    const work = mkdtempSync(path.join(os.tmpdir(), `cold-${tool.name}-`))
    const cache = path.join(work, 'cache')
    mkdirSync(cache, { recursive: true })
    writeFileSync(path.join(work, 'package.json'), pkg)
    const env = Object.assign({}, process.env, tool.env(cache))
    const sec = time(resolve(tool.cold, cache), { cwd: work, env, stdio: 'ignore' })
    total += sec
    best = Math.min(best, sec)
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
  return { avg: total / RUNS, best }
}

// warm: a persistent project + cache; warm up once, then only remove
// node_modules before each measured run.
const warm = (tool) => {
  const work = mkdtempSync(path.join(os.tmpdir(), `warm-${tool.name}-`))
  const cache = path.join(work, 'cache')
  mkdirSync(cache, { recursive: true })
  writeFileSync(path.join(work, 'package.json'), pkg)
  const env = Object.assign({}, process.env, tool.env(cache))
  execSync(resolve(tool.warmSetup, cache), { cwd: work, env, stdio: 'ignore' })
  let total = 0
  let best = Infinity
  for (let i = 0; i < RUNS; i++) {
    rmSync(path.join(work, 'node_modules'), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    const sec = time(resolve(tool.warm, cache), { cwd: work, env, stdio: 'ignore' })
    total += sec
    best = Math.min(best, sec)
  }
  rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  return { avg: total / RUNS, best }
}

const report = (label, fn) => {
  console.log(`\n${label} (avg of ${RUNS} runs)`)
  for (const tool of tools) {
    if (tool.name !== 'dep' && !installed(tool.name)) {
      console.log(`  ${tool.name.padEnd(6)} not installed, skipped`)
      continue
    }
    const r = fn(tool)
    console.log(`  ${tool.name.padEnd(6)} avg ${r.avg.toFixed(2)}s   best ${r.best.toFixed(2)}s`)
  }
}

report('cold install (no cache, no lockfile)', cold)
report('warm install (lockfile + warm cache, node_modules removed)', warm)
