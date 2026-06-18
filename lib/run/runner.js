import { spawn } from 'child_process'
import path from 'path'
import npmPath from 'npm-path'
import each from 'promise-each'

export default (_, pkg, cwd) => {
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
  // Always put the local node_modules/.bin first so scripts can invoke
  // installed bins, then let npm-path add the rest, falling back to the
  // inherited PATH if npm-path can't resolve a prefix on this platform.
  const localBin = path.join(cwd, 'node_modules', '.bin')
  let extra
  try {
    extra = npmPath.getSync({ cwd })
  } catch (e) {
    extra = process.env[npmPath.PATH] || ''
  }
  env[npmPath.PATH] = [localBin, extra].filter(Boolean).join(path.delimiter)
  return Promise.resolve(cmds).then(each((cmd) => {
    return new Promise((resolve, reject) => {
      const script = spawn(cmd, args, { cwd, shell: true, env, stdio: 'inherit' })
      script.on('error', reject)
      script.on('close', (code) => {
        if (code === 0) return resolve()
        reject(new Error(`Command failed with exit code ${code}: ${cmd}`))
      })
    })
  }))
}
