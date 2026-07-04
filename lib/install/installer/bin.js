import fs from 'fs'
import { readFile } from 'fs/promises'
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

// `binField` is the package.json `bin` value when the caller already knows it
// from resolver/lockfile metadata (`null` meaning known to have none); when
// omitted it is read from the package's package.json.
const bin = async (key, target, binField) => {
  if (binField === undefined) {
    const pkgJSON = JSON.parse(await readFile(path.join(target, 'package.json')))
    binField = pkgJSON.bin
  }
  if (!binField) return
  fs.mkdirSync(path.join(nm, '.bin'), { recursive: true })
  if (typeof binField === 'string') {
    // A string bin is named after the package, with any scope stripped, so
    // `@babel/parser` links as `.bin/parser` rather than `.bin/@babel/parser`.
    const name = key.charAt(0) === '@' ? key.split('/')[1] : key
    await link(path.join(target, binField), path.join(nm, '.bin', name))
  } else if (typeof binField === 'object') {
    for (const cmd of Object.keys(binField)) {
      await link(path.join(target, binField[cmd]), path.join(nm, '.bin', cmd))
    }
  }
}

export default bin
