const path = require('path')
const { readFileSync, readdirSync } = require('fs')
const nm = require('../utils/nm')

const tree = (base) => {
  base = base || nm
  const files = readdirSync(base).filter((n) => {
    return n[0] !== '.'
  })
  files.forEach((file) => {
    const pkgJSON = require(path.join(base, file, 'package.json'))
    global.dependenciesTree[pkgJSON.name] = {
      version: pkgJSON.version
    }
  })
}

module.exports = tree
