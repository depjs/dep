const fs = require('fs-extra')
const path = require('path')
const nm = require('../../utils/nm')

const isWindows = process.platform === 'win32'
const removeIfExists = (filePath) => {
  try {
    fs.rmSync(filePath, { force: true })
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

const makePosixLink = (source, dest) => {
  removeIfExists(dest)
  fs.symlinkSync(source, dest)
  try {
    fs.chmodSync(source, 0o755)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

const makeWindowsShims = (source, dest) => {
  removeIfExists(dest)
  let linked = false
  try {
    fs.symlinkSync(source, dest, 'file')
    linked = true
  } catch (error) {
    if (!['EACCES', 'EPERM', 'UNKNOWN'].includes(error.code)) {
      throw error
    }
    fs.copyFileSync(source, dest)
  }

  try {
    fs.chmodSync(source, 0o755)
  } catch (error) {
    if (!['ENOENT', 'EPERM', 'EINVAL'].includes(error.code)) {
      throw error
    }
  }

  const nodePath = process.execPath
  const cmdContent = `@ECHO OFF\r\n"${nodePath}" "${source}" %*\r\n`
  const psContent = `& "${nodePath}" "${source}" $args\r\n`

  removeIfExists(`${dest}.cmd`)
  removeIfExists(`${dest}.ps1`)

  fs.writeFileSync(`${dest}.cmd`, cmdContent, 'utf8')
  fs.writeFileSync(`${dest}.ps1`, psContent, 'utf8')

  return linked
}

const createBinEntry = (command, relativePath, targetDir) => {
  const binDir = path.join(nm, '.bin')
  const source = path.join(targetDir, relativePath)
  const dest = path.join(binDir, command)

  fs.ensureDirSync(binDir)

  if (isWindows) {
    makeWindowsShims(source, dest)
  } else {
    makePosixLink(source, dest)
  }

  if (!isWindows) return

  try {
    fs.chmodSync(dest, 0o755)
  } catch (error) {
    if (!['ENOENT', 'EPERM', 'EINVAL'].includes(error.code)) {
      throw error
    }
  }
}

const bin = (key, target) => {
  const pkgJSON = require(path.join(target, 'package.json'))
  if (!pkgJSON.bin) return

  if (typeof pkgJSON.bin === 'string') {
    createBinEntry(key, pkgJSON.bin, target)
  } else if (typeof pkgJSON.bin === 'object') {
    Object.keys(pkgJSON.bin).forEach((cmd) => {
      createBinEntry(cmd, pkgJSON.bin[cmd], target)
    })
  }
}

module.exports = bin
