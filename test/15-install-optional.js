import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

const mkProject = (pkg) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-opt-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify(Object.assign({ name: 't', version: '1.0.0' }, pkg)))
  return dir
}

// chokidar@3 optionally depends on fsevents, which is darwin-only — so on a
// non-darwin platform it must be skipped without failing the install.
tap.test('install follows transitive optionalDependencies but skips platform mismatches', (t) => {
  const dir = mkProject({ dependencies: { chokidar: '^3.6.0' } })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'chokidar')), 'the package is installed')
    // readdirp is a normal transitive dep and must be present
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'readdirp')), 'transitive dependency installed')
    if (process.platform !== 'darwin') {
      t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'fsevents')), 'darwin-only optional dep skipped off-darwin')
    } else {
      t.pass('on darwin fsevents may be installed')
    }
    t.end()
  })
})

// npm merges optionalDependencies into dependencies when publishing, so a
// package like jest-haste-map lists fsevents (darwin-only) in BOTH fields of
// its registry metadata. The optionalDependencies entry overrides the
// dependencies one (npm semantics): the platform mismatch must be skipped,
// not treated as a required dep that fails the install.
tap.test('a dep listed in both dependencies and optionalDependencies stays optional', (t) => {
  const dir = mkProject({ dependencies: { 'jest-haste-map': '^29.7.0' } })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install ran without error')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'jest-haste-map')), 'the package is installed')
    t.notOk(fs.existsSync(path.join(dir, 'node_modules', '.dep-staging')), 'the prefetch staging area is cleaned up')
    if (process.platform !== 'darwin') {
      t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'fsevents')), 'darwin-only optional dep skipped off-darwin')
    } else {
      t.pass('on darwin fsevents may be installed')
    }
    exec(`node ${bin} lock`, { cwd: dir }, (err) => {
      t.error(err, 'lock ran without error')
      const pkgs = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).packages
      t.ok(pkgs['node_modules/fsevents'] && pkgs['node_modules/fsevents'].optional,
        'the lockfile keeps fsevents and marks it optional')
      fs.rmSync(path.join(dir, 'node_modules'), { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
      exec(`node ${bin} install`, { cwd: dir }, (err) => {
        t.error(err, 'a lock-driven install also skips the mismatch')
        t.ok(fs.existsSync(path.join(dir, 'node_modules', 'jest-haste-map')), 'the package is installed from the lock')
        t.end()
      })
    })
  })
})

tap.test('a missing/unresolvable optional dependency does not fail the install', (t) => {
  const dir = mkProject({
    dependencies: { 'is-odd': '^3.0.0' },
    optionalDependencies: { 'dep-nonexistent-optional-xyz': '^1.0.0' }
  })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'install succeeds despite an unresolvable optional dep')
    t.ok(fs.existsSync(path.join(dir, 'node_modules', 'is-odd')), 'required deps still installed')
    t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'dep-nonexistent-optional-xyz')), 'the bad optional is absent')
    t.end()
  })
})

tap.test('lock keeps platform-specific optionals and marks them optional', (t) => {
  const dir = mkProject({ dependencies: { chokidar: '^3.6.0' } })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} lock`, { cwd: dir }, (err) => {
    t.error(err, 'lock ran without error')
    const pkgs = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).packages
    const fsevents = pkgs['node_modules/fsevents']
    t.ok(fsevents, 'fsevents is kept in the cross-platform lockfile')
    t.ok(fsevents.optional, 'fsevents is marked optional')
    t.notOk(pkgs['node_modules/readdirp'].optional, 'a required transitive dep is not marked optional')
    t.end()
  })
})
