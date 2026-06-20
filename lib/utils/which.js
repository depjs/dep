import fs from 'fs'
import path from 'path'

const isWin = process.platform === 'win32'

// On Windows an executable may carry one of several extensions; on POSIX the
// name is used as-is.
const exts = isWin
  ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
  : ['']

const isExe = (file) => {
  try {
    if (!fs.statSync(file).isFile()) return false
    if (!isWin) fs.accessSync(file, fs.constants.X_OK)
    return true
  } catch (e) {
    return false
  }
}

// Resolve `cmd` to an executable path. An explicit path is used as-is,
// otherwise each PATH entry is searched (trying each Windows extension).
const lookup = (cmd) => {
  if (cmd.includes('/') || (isWin && cmd.includes('\\'))) {
    return exts.map((ext) => cmd + ext).find(isExe) || null
  }
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean)
  for (const dir of dirs) {
    const found = exts.map((ext) => path.join(dir, cmd + ext)).find(isExe)
    if (found) return found
  }
  return null
}

const which = (cmd) => {
  return new Promise((resolve, reject) => {
    const found = lookup(cmd)
    if (found) return resolve(found)
    reject(new Error(`not found: ${cmd}`))
  })
}

which.sync = (cmd) => {
  const found = lookup(cmd)
  if (!found) throw new Error(`not found: ${cmd}`)
  return found
}

export default which
