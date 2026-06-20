import os from 'os'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import semver from './semver.js'

// Lightweight, zero-dependency replacement for `update-notifier`.
//
// We never block the CLI on the network: each run notifies based on the
// version cached by a *previous* run, and (at most once a day) refreshes that
// cache in a detached child process that outlives the current command.
const ONE_DAY = 1000 * 60 * 60 * 24

export const cacheFile = path.join(os.homedir(), '.config', 'dep', 'update-check.json')

export const readCache = () => {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
  } catch (e) {
    return {}
  }
}

export const writeCache = (data) => {
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
    fs.writeFileSync(cacheFile, JSON.stringify(data))
  } catch (e) {}
}

const checkScript = fileURLToPath(new URL('./update-check.js', import.meta.url))

export default ({ name, version }) => {
  const cache = readCache()

  if (cache.latest && semver.gt(cache.latest, version)) {
    process.stderr.write(
      `\n  Update available ${version} → ${cache.latest}\n` +
      `  Run \`npm i -g ${name}\` to update\n\n`
    )
  }

  if (!cache.lastCheck || Date.now() - cache.lastCheck > ONE_DAY) {
    const child = spawn(process.execPath, [checkScript, name], {
      detached: true,
      stdio: 'ignore'
    })
    child.unref()
  }
}
