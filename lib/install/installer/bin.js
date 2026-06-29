import fs from 'fs'
import path from 'path'
import cmdShim from '../../utils/cmd-shim.js'
import nm from '../../utils/nm.js'

const isWin = process.platform === 'win32'

// Link a single bin into node_modules/.bin. On POSIX a symlink + chmod is
// enough; on Windows the shell can't run an extensionless symlink to a .js
// file, so create the same `.cmd`/`.ps1`/sh shims npm does (via cmd-shim).
const link = async (source, dest) => {
  if (isWin) {
    await cmdShim(source, dest)
    return
  }
  try {
    fs.unlinkSync(dest)
  } catch (e) {}
  fs.symlinkSync(source, dest)
  fs.chmodSync(source, '0755')
}

const bin = async (key, target) => {
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(target, 'package.json')))
  if (!pkgJSON.bin) return
  fs.mkdirSync(path.join(nm, '.bin'), { recursive: true })
  if (typeof pkgJSON.bin === 'string') {
    // A string bin is named after the package, with any scope stripped, so
    // `@babel/parser` links as `.bin/parser` rather than `.bin/@babel/parser`.
    const name = key.charAt(0) === '@' ? key.split('/')[1] : key
    await link(path.join(target, pkgJSON.bin), path.join(nm, '.bin', name))
  } else if (typeof pkgJSON.bin === 'object') {
    for (const cmd of Object.keys(pkgJSON.bin)) {
      await link(path.join(target, pkgJSON.bin[cmd]), path.join(nm, '.bin', cmd))
    }
  }
}

export default bin
