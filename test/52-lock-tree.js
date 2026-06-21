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
      '': { name: 'root' },
      'node_modules/reg': { version: '1.0.0', resolved: 'https://registry/reg.tgz', integrity: 'sha512-x' },
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
