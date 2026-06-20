import { spawn } from 'child_process'
import path from 'path'
import PATH from '../utils/path-key.js'

const runCmd = (cmd, args, opts) => {
  return new Promise((resolve, reject) => {
    const script = spawn(cmd, args, opts)
    script.on('error', reject)
    script.on('close', (code) => {
      if (code === 0) return resolve()
      reject(new Error(`Command failed with exit code ${code}: ${cmd}`))
    })
  })
}

export default async (_, pkg, cwd) => {
  cwd = cwd || process.cwd()
  const args = _.slice(1)
  const scripts = pkg.scripts
  const key = args.shift()
  const cmds = Object.keys(scripts).filter((script) => {
    return script === 'pre' + key ||
      script === key ||
      script === 'post' + key
  }).map((script) => {
    return scripts[script]
  })
  const env = { ...process.env }
  // Put the local node_modules/.bin first so scripts can invoke installed
  // bins, then fall back to the inherited PATH.
  const localBin = path.join(cwd, 'node_modules', '.bin')
  env[PATH] = [localBin, process.env[PATH]].filter(Boolean).join(path.delimiter)
  // Run the pre/<key>/post scripts in order; each must finish before the next.
  for (const cmd of cmds) {
    await runCmd(cmd, args, { cwd, shell: true, env, stdio: 'inherit' })
  }
}
