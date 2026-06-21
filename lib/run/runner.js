import { runCmd, binEnv } from '../utils/lifecycle.js'

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
  const env = binEnv(cwd)
  // Run the pre/<key>/post scripts in order; each must finish before the next.
  for (const cmd of cmds) {
    await runCmd(cmd, args, { cwd, shell: true, env, stdio: 'inherit' })
  }
}
