import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import tree from 'strong-npm-ls'
import tap from 'tap'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')
const pkg = path.join(import.meta.dirname, 'deps/install-save')
const pkgJSON = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))

tap.test((t) => {
  const file = 'happy-birthday@' + path.join(import.meta.dirname, 'deps/file/happy-birthday-0.6.0')
  exec(`node ${bin} install --save=prod ${file}`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: install ran without error`)
    tree.read(pkg, (err, out) => {
      t.error(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.dependencies
      t.ok(deps['happy-birthday'], `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})

tap.test((t) => {
  exec(`node ${bin} install --save=dev text-table`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: install ran without error`)
    tree.read(pkg, (err, out) => {
      t.error(err, `${pkgJSON.name}: tree could be read`)
      const deps = out.devDependencies
      t.ok(deps['text-table'], `${pkgJSON.name}: deps are installed`)
      t.end()
    })
  })
})

tap.test((t) => {
  const data = pkgJSON
  delete data.dependencies
  delete data.devDependencies
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify(data, null, 2) + '\n')
  t.end()
})
