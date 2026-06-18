import { spawn } from 'child_process'
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
  const env = process.env
  const newPath = npmPath.getSync({})
  env[npmPath.PATH] = newPath
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
