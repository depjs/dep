import fs from 'fs'
import path from 'path'
import npmrc from '../utils/npmrc.js'
import npa from '../utils/npa.js'

export default (pkgs, save) => {
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
  const saveDeps = {}
  pkgs.forEach((pkg) => {
    // npa keeps scoped names (@scope/name) intact; the spec is whatever
    // follows "name@".
    const key = npa(pkg, process.cwd()).name
    let value = pkg.slice(key.length + 1)
    const dep = global.dependenciesTree[key]
    if (!value) {
      switch (dep.type) {
        case 'registry':
          value = npmrc['save-prefix'] + dep.version
          break
        default:
          value = dep.url
          break
      }
    }
    saveDeps[key] = value
  })
  const field = save === 'dev' ? 'devDependencies' : 'dependencies'
  const oldDeps = pkgJSON[field] || {}
  const newDeps = Object.assign({}, oldDeps, saveDeps)
  pkgJSON[field] = newDeps
  fs.writeFileSync(
    path.join(process.cwd(), 'package.json'),
    JSON.stringify(pkgJSON, null, 2)
  )
}
