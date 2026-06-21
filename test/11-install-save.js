import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import tree from './helpers/tree.js'
import tap from './helpers/tap.js'

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
  const file = 'happy-birthday@' + path.join(import.meta.dirname, 'deps/file/happy-birthday-0.6.0')
  exec(`node ${bin} install --save ${file}`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: bare --save ran without error`)
    const json = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))
    t.ok(json.dependencies && json.dependencies['happy-birthday'], `${pkgJSON.name}: bare --save writes to dependencies`)
    t.end()
  })
})

tap.test((t) => {
  exec(`node ${bin} install --save-dev text-table`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: --save-dev ran without error`)
    const json = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))
    t.ok(json.devDependencies && json.devDependencies['text-table'], `${pkgJSON.name}: --save-dev writes to devDependencies`)
    t.end()
  })
})

tap.test((t) => {
  const name = '@watilde/hello-scoped-package'
  exec(`node ${bin} install ${name} --save`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, `${pkgJSON.name}: scoped --save ran without error`)
    const json = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json')))
    t.ok(json.dependencies && json.dependencies[name], `${pkgJSON.name}: scoped pkg saved under its full name`)
    t.ok(fs.existsSync(path.join(pkg, 'node_modules', '@watilde', 'hello-scoped-package')), `${pkgJSON.name}: scoped pkg installed under node_modules/@scope/name`)
    t.end()
  })
})

tap.test((t) => {
  const data = pkgJSON
  delete data.dependencies
  delete data.devDependencies
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify(data, null, 2) + '\n')
  t.end()
})
