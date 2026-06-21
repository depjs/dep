// Cold-install benchmark: npm vs yarn vs pnpm vs dep.
//
// Each run uses a fresh project directory and a fresh, isolated cache/store, so
// every install starts from a truly cold cache with no lockfile. yarn is pinned
// to the node-modules linker so all four produce a comparable node_modules.
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
    cmd: () => 'npm install --no-audit --no-fund --no-package-lock',
    env: (cache) => ({ npm_config_cache: cache })
  },
  {
    name: 'yarn',
    cmd: () => 'yarn install --no-immutable',
    env: (cache) => ({ YARN_ENABLE_GLOBAL_CACHE: 'false', YARN_NODE_LINKER: 'node-modules', YARN_CACHE_FOLDER: cache })
  },
  {
    name: 'pnpm',
    cmd: (cache) => `pnpm install --no-lockfile --store-dir ${path.join(cache, 'store')}`,
    env: () => ({})
  },
  {
    name: 'dep',
    cmd: () => `node ${depBin} install`,
    env: () => ({ NO_UPDATE_NOTIFIER: '1' })
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

for (const tool of tools) {
  if (tool.name !== 'dep' && !installed(tool.name)) {
    console.log(`${tool.name}: not installed, skipped`)
    continue
  }
  let total = 0
  let best = Infinity
  for (let i = 0; i < RUNS; i++) {
    const work = mkdtempSync(path.join(os.tmpdir(), `bench-${tool.name}-`))
    const cache = path.join(work, 'cache')
    mkdirSync(cache, { recursive: true })
    writeFileSync(path.join(work, 'package.json'), pkg)
    const env = Object.assign({}, process.env, tool.env(cache))
    const start = process.hrtime.bigint()
    execSync(tool.cmd(cache), { cwd: work, env, stdio: 'ignore' })
    const sec = Number(process.hrtime.bigint() - start) / 1e9
    total += sec
    best = Math.min(best, sec)
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
  console.log(`${tool.name.padEnd(6)} avg ${(total / RUNS).toFixed(2)}s   best ${best.toFixed(2)}s`)
}
