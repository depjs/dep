import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'
import lockTree from '../lib/install/lock-tree.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkProject = (deps) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-lock-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', version: '1.0.0', dependencies: deps }))
  return dir
}

tap.test('lockTree rebuilds the hoisted tree from package-lock.json', (t) => {
  const dir = mkProject({ 'is-odd': '^3.0.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    const tree = lockTree(dir, ['is-odd'])
    t.ok(tree['is-odd'] && tree['is-odd'].type === 'registry', 'top-level is-odd node rebuilt')
    t.ok(tree['is-odd'].tarball, 'node carries the resolved tarball url')
    // is-odd@3's is-number@6 has no conflict, so it hoists to the top level
    t.ok(tree['is-number'] && tree['is-number'].tarball, 'hoisted is-number rebuilt at the top level')
    t.equal(lockTree(dir, ['is-odd', 'not-locked']), null, 'stale lock (missing dep) returns null')
    t.end()
  })
})

tap.test('install uses the lockfile and skips registry resolution', (t) => {
  const dir = mkProject({ 'is-odd': '^3.0.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')

    // Point the registry at a bogus host: only a lock-driven install (which
    // uses the absolute tarball urls) can succeed without resolving packuments.
    fs.writeFileSync(path.join(dir, '.npmrc'), 'registry=https://bogus.invalid.example/\n')
    const env = Object.assign({}, process.env, { HOME: dir, USERPROFILE: dir })

    exec(`node ${bin} install`, { cwd: dir, env }, (err2, stdout) => {
      t.error(err2, 'install ran without error against a bogus registry')
      t.match(stdout, /Using package-lock\.json/, 'install reports it used the lockfile')
      const isOdd = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', 'is-odd', 'package.json')))
      t.match(isOdd.version, /^3\./, 'is-odd installed from the locked tarball')
      const isNumber = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', 'is-number', 'package.json')))
      t.match(isNumber.version, /^6\./, 'nested dependency installed from the lock')
      t.end()
    })
  })
})

tap.test('a lock-driven install reinstalls local directory deps by copying', (t) => {
  const dir = mkProject({ 'plain-local': 'file:./pkg' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  fs.mkdirSync(path.join(dir, 'pkg'))
  fs.writeFileSync(path.join(dir, 'pkg', 'package.json'),
    JSON.stringify({ name: 'plain-local', version: '2.0.0' }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')

    exec(`node ${bin} install`, { cwd: dir }, (err2, stdout) => {
      t.error(err2, 'install ran without error')
      t.match(stdout, /Using package-lock\.json/, 'install reports it used the lockfile')
      const installed = JSON.parse(
        fs.readFileSync(path.join(dir, 'node_modules', 'plain-local', 'package.json')))
      t.equal(installed.version, '2.0.0', 'the local package is copied into node_modules')
      t.end()
    })
  })
})

// The lockfile records every platform's optional variants (npm-compatible);
// the install must materialise only the current platform's.
tap.test('a lock-driven install skips optional deps for other platforms', (t) => {
  const dir = mkProject({ chokidar: '^3.6.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json')))
    t.ok(lock.packages['node_modules/fsevents'], 'the lock keeps the darwin-only optional entry')

    exec(`node ${bin} install`, { cwd: dir }, (err2, stdout) => {
      t.error(err2, 'install ran without error')
      t.match(stdout, /Using package-lock\.json/, 'install reports it used the lockfile')
      t.ok(fs.existsSync(path.join(dir, 'node_modules', 'chokidar', 'package.json')), 'chokidar is installed')
      t.equal(
        fs.existsSync(path.join(dir, 'node_modules', 'fsevents', 'package.json')),
        process.platform === 'darwin',
        'the darwin-only optional dep is installed only on darwin')
      t.end()
    })
  })
})

tap.test('a stale lock falls back to a fresh resolve', (t) => {
  const dir = mkProject({ 'is-odd': '^3.0.0' })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    // Add a dependency the lockfile doesn't know about.
    fs.writeFileSync(path.join(dir, 'package.json'),
      JSON.stringify({ name: 't', version: '1.0.0', dependencies: { 'is-odd': '^3.0.0', once: '^1.4.0' } }))

    exec(`node ${bin} install`, { cwd: dir }, (err2, stdout) => {
      t.error(err2, 'install ran without error')
      t.match(stdout, /Resolving dependencies/, 'stale lock triggers a fresh resolve')
      t.ok(fs.existsSync(path.join(dir, 'node_modules', 'once', 'package.json')), 'the new dependency is installed')
      t.end()
    })
  })
})
