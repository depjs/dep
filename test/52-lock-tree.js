import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'
import lockTree from '../lib/install/lock-tree.js'

// lockTree rebuilds the installer tree from an npm v3 package-lock.json. It maps
// location keys to nested nodes and classifies each entry as git or registry.

const withLock = (t, lock) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-lt-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))
  if (lock !== null) fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify(lock))
  return dir
}

tap.test('lockTree classifies git and registry entries and nests them', (t) => {
  const dir = withLock(t, {
    lockfileVersion: 3,
    packages: {
      '': { name: 'root', dependencies: { reg: '^1.0.0', gitdep: 'github:a/b' } },
      'node_modules/reg': { version: '1.0.0', resolved: 'https://registry/reg.tgz', integrity: 'sha512-x', dependencies: { nested: '^3.0.0' } },
      'node_modules/gitdep': { version: '2.0.0', resolved: 'git+https://github.com/a/b.git#deadbee' },
      'node_modules/reg/node_modules/nested': { version: '3.0.0', resolved: 'https://registry/nested.tgz' },
      'node_modules/wslink': { link: true, resolved: 'packages/ws' },
      'packages/ws': { name: 'ws' }
    }
  })
  const tree = lockTree(dir, ['reg', 'gitdep'])

  t.equal(tree.reg.type, 'registry', 'registry entry classified by tarball url')
  t.equal(tree.reg.tarball, 'https://registry/reg.tgz', 'tarball recorded')
  t.equal(tree.reg.integrity, 'sha512-x', 'integrity carried over')
  t.equal(tree.gitdep.type, 'git', 'git+ url classified as git')
  t.equal(tree.gitdep.url, 'https://github.com/a/b.git#deadbee', 'git+ prefix stripped from the url')
  t.equal(tree.reg.dependencies.nested.version, '3.0.0', 'nested dep placed under its parent')
  t.notOk(tree.wslink, 'a workspace link is not materialised as a package')
  t.notOk(tree.ws, 'a workspace source entry is ignored')
  t.end()
})

tap.test('lockTree skips entries nested under a link and prunes orphan placeholders', (t) => {
  const dir = withLock(t, {
    lockfileVersion: 3,
    packages: {
      '': { name: 'root' },
      'node_modules/reg': { version: '1.0.0', resolved: 'https://registry/reg.tgz' },
      'node_modules/wslink': { link: true, resolved: 'packages/ws' },
      'packages/ws': { name: 'ws' },
      // npm nests a workspace's conflicting dep below the link's location; it
      // belongs to the workspace source tree, not to node_modules.
      'node_modules/wslink/node_modules/conflict': { version: '2.0.0', resolved: 'https://registry/conflict.tgz' },
      // a nested location whose parent has no entry of its own must not leave
      // a typeless placeholder behind (the installer cannot fetch it)
      'node_modules/ghost/node_modules/orphan': { version: '3.0.0', resolved: 'https://registry/orphan.tgz' }
    }
  })
  const tree = lockTree(dir, ['reg'])

  t.equal(tree.reg.type, 'registry', 'real entries are kept')
  t.notOk(tree.wslink, 'no node is materialised below a link location')
  t.notOk(tree.ghost, 'an orphan placeholder is pruned')
  Object.keys(tree).forEach((name) => {
    t.ok(tree[name].type, `${name} has a fetchable type`)
  })
  t.end()
})

// The lockfile legitimately records every platform's optional binary variants
// (npm-compatible); only the entries matching the current platform — and the
// entries still reachable once the others are skipped — may be installed.
tap.test('lockTree skips other platforms\' optional entries and their exclusive deps', (t) => {
  const dir = withLock(t, {
    lockfileVersion: 3,
    packages: {
      '': { name: 'root', dependencies: { main: '^1.0.0' } },
      'node_modules/main': {
        version: '1.0.0',
        resolved: 'https://registry/main.tgz',
        optionalDependencies: { 'bin-here': '^1.0.0', 'bin-other': '^1.0.0', 'bin-other-libc': '^1.0.0' }
      },
      'node_modules/bin-here': {
        version: '1.0.0',
        resolved: 'https://registry/bin-here.tgz',
        os: [process.platform],
        cpu: [process.arch],
        optional: true
      },
      'node_modules/bin-other': {
        version: '1.0.0',
        resolved: 'https://registry/bin-other.tgz',
        os: ['dep-test-other-os'],
        optional: true,
        dependencies: { 'other-helper': '^1.0.0' }
      },
      'node_modules/bin-other-libc': {
        version: '1.0.0',
        resolved: 'https://registry/bin-other-libc.tgz',
        os: [process.platform],
        cpu: [process.arch],
        libc: ['dep-test-other-libc'],
        optional: true
      },
      // reachable only through the skipped bin-other
      'node_modules/other-helper': { version: '1.0.0', resolved: 'https://registry/other-helper.tgz', optional: true }
    }
  })
  const tree = lockTree(dir, ['main'])

  t.ok(tree.main, 'the required package is kept')
  t.ok(tree['bin-here'], 'the current platform\'s optional variant is kept')
  t.notOk(tree['bin-other'], 'another os\'s optional variant is skipped')
  t.notOk(tree['bin-other-libc'], 'another libc\'s optional variant is skipped')
  t.notOk(tree['other-helper'], 'a dep reachable only through a skipped package is skipped too')
  t.end()
})

tap.test('lockTree fails on a required entry for another platform (npm EBADPLATFORM)', (t) => {
  const dir = withLock(t, {
    lockfileVersion: 3,
    packages: {
      '': { name: 'root', dependencies: { native: '^1.0.0' } },
      'node_modules/native': { version: '1.0.0', resolved: 'https://registry/native.tgz', os: ['dep-test-other-os'] }
    }
  })
  t.throws(() => lockTree(dir, ['native']), /Unsupported platform/, 'a required platform mismatch throws')
  t.end()
})

tap.test('lockTree returns null for a missing, non-v3, or stale lockfile', (t) => {
  t.equal(lockTree(withLock(t, null), ['a']), null, 'missing lockfile')
  t.equal(lockTree(withLock(t, { lockfileVersion: 2, packages: {} }), []), null, 'wrong lockfile version')
  t.equal(
    lockTree(withLock(t, { lockfileVersion: 3, packages: { '': {} } }), ['absent']),
    null,
    'a requested top-level dep that is not locked is stale'
  )
  t.end()
})
