import which from './which.js'
import { execFile, execFileSync } from 'child_process'

const prefix = process.platform === 'win32' ? ['-c', 'core.longpaths=true'] : []

const git = (cmds, opt) => {
  opt = Object.assign({ encoding: 'utf8' }, opt)
  return which('git').then((bin) => {
    return new Promise((resolve, reject) => {
      const args = prefix.concat(cmds)
      execFile(bin, args, opt, (e, stdout) => {
        if (e) return reject(e)
        resolve(stdout)
      })
    })
  })
}

git.sync = (cmds, opt) => {
  opt = Object.assign({ encoding: 'utf8' }, opt)
  const bin = which.sync('git')
  const args = prefix.concat(cmds)
  return execFileSync(bin, args, opt)
}

export default git
