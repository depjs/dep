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

// Build an environment whose PATH has the local node_modules/.bin first, so
// scripts can invoke installed bins.
export const binEnv = (cwd) => {
  const env = { ...process.env }
  const localBin = path.join(cwd, 'node_modules', '.bin')
  env[PATH] = [localBin, process.env[PATH]].filter(Boolean).join(path.delimiter)
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
