const fs = require('fs')
const path = require('path')
const nm = require('../../utils/nm')

const bin = (key, target) => {
  const pkgJSON = require(path.join(target, 'package.json'))
  if (!pkgJSON.bin) return
  if (typeof pkgJSON.bin === 'string') {
    try {
      fs.unlinkSync(path.join(nm, '.bin', key))
    } catch (e) {}
    fs.symlinkSync(
      path.join(target, pkgJSON.bin),
      path.join(nm, '.bin', key)
    )
  } else if (typeof pkgJSON.bin === 'object') {
    Object.keys(pkgJSON.bin).forEach((cmd) => {
      try {
        fs.unlinkSync(path.join(nm, '.bin', cmd))
      } catch (e) {}
      fs.symlinkSync(
        path.join(target, pkgJSON.bin[cmd]),
        path.join(nm, '.bin', cmd)
      )
    })
  }
}

module.exports = bin
