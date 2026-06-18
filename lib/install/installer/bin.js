import fs from 'fs-extra'
import path from 'path'
import nm from '../../utils/nm.js'

const bin = (key, target) => {
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(target, 'package.json')))
  if (!pkgJSON.bin) return
  fs.ensureDirSync(path.join(nm, '.bin'))
  if (typeof pkgJSON.bin === 'string') {
    try {
      fs.unlinkSync(path.join(nm, '.bin', key))
    } catch (e) {}
    fs.symlinkSync(
      path.join(target, pkgJSON.bin),
      path.join(nm, '.bin', key)
    )
    fs.chmodSync(path.join(target, pkgJSON.bin), '0755')
  } else if (typeof pkgJSON.bin === 'object') {
    Object.keys(pkgJSON.bin).forEach((cmd) => {
      try {
        fs.unlinkSync(path.join(nm, '.bin', cmd))
      } catch (e) {}
      fs.symlinkSync(
        path.join(target, pkgJSON.bin[cmd]),
        path.join(nm, '.bin', cmd)
      )
      fs.chmodSync(path.join(target, pkgJSON.bin[cmd]), '0755')
    })
  }
}

export default bin
