import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import PATH from './path-key.js'

// Spawn a single script command, resolving on exit 0 and rejecting otherwise.
export const runCmd = (cmd, args, opts) => {
  return new Promise((resolve, reject) => {
    const script = spawn(cmd, args, opts)
    script.on('error', reject)
    script.on('close', (code) => {
      if (code === 0) return resolve()
      reject(new Error(`Command failed with exit code ${code}: ${cmd}`))
    })
  })
}

// Build an environment whose PATH has the local node_modules/.bin directories
// first, so scripts can invoke installed bins. A package's own bins live in its
// node_modules/.bin, but a hoisted dependency's bin lives in an ancestor's
// node_modules/.bin (usually the project root), so walk up from cwd and add
// every ancestor's .bin — matching npm. (e.g. unrs-resolver's postinstall calls
// the `napi-postinstall` bin, hoisted to the root node_modules/.bin.)
export const binEnv = (cwd) => {
  const env = { ...process.env }
  const bins = []
  let dir = cwd
  let prev
  do {
    bins.push(path.join(dir, 'node_modules', '.bin'))
    prev = dir
    dir = path.dirname(dir)
  } while (dir !== prev)
  env[PATH] = [...bins, process.env[PATH]].filter(Boolean).join(path.delimiter)
  return env
}

// Run the named lifecycle scripts (in order, only those present) from a
// package's package.json. Returns true if at least one script ran.
export default async (cwd, names) => {
  let pkg
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')))
  } catch (e) {
    return false
  }
  const scripts = pkg.scripts || {}
  const env = binEnv(cwd)
  let ran = false
  for (const name of names) {
    const cmd = scripts[name]
    if (!cmd) continue
    ran = true
    await runCmd(cmd, [], { cwd, shell: true, env, stdio: 'inherit' })
  }
  return ran
}
