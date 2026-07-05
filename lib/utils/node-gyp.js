import { execFileSync } from 'child_process'
import which from './which.js'

const isWin = process.platform === 'win32'

// node-gyp is a full native build toolchain we no longer bundle. Locate the
// one provided by the environment: a standalone `node-gyp` on PATH, otherwise
// the copy shipped with npm (`npm exec -- node-gyp`).
const locate = () => {
  try {
    return { cmd: which.sync('node-gyp'), args: [] }
  } catch (e) {}
  try {
    return { cmd: which.sync('npm'), args: ['exec', '--', 'node-gyp'] }
  } catch (e) {}
  throw new Error(
    'node-gyp not found; install it (npm i -g node-gyp) to build native modules'
  )
}

export default (opts) => {
  const { cmd, args } = locate()
  // .cmd/.bat shims on Windows must be run through the shell.
  const shell = isWin && /\.(cmd|bat)$/i.test(cmd)
  // Capture output instead of inheriting stderr: an optional dependency's
  // failed build must stay silent, and a required one's compiler output is
  // reported through the thrown error (err.stderr) by the caller.
  execFileSync(cmd, [...args, '--silent', 'rebuild'], {
    ...opts, shell, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024
  })
}
