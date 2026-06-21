import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')
const pkg = path.join(import.meta.dirname, 'deps', 'registry')

tap.test((t) => {
  const lockPath = path.join(pkg, 'package-lock.json')
  exec(`node ${bin} lock`, { cwd: pkg }, (err, stdout, stderr) => {
    t.error(err, 'lock ran without error')
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
    t.equal(lock.lockfileVersion, 3, 'lockfileVersion is 3')
    t.ok(lock.packages[''], 'root package entry exists')
    t.equal(lock.packages[''].name, 'registry', 'root name matches package.json')
    const dep = lock.packages['node_modules/happy-birthday']
    t.ok(dep, 'dependency is locked under its install path')
    t.ok(dep.version, 'locked dependency has a version')
    t.ok(dep.resolved, 'locked dependency has a resolved url')
    t.ok(dep.integrity, 'locked dependency has integrity')
    fs.unlinkSync(lockPath)
    t.end()
  })
})
