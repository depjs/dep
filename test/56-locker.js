import fs from 'fs'
import os from 'os'
import path from 'path'
import tap from './helpers/tap.js'

// locker writes package-lock.json into process.cwd() (captured when the module
// loads), so chdir into a temp dir and import it dynamically. This drives the
// legacy-shasum -> SRI conversion that registry locks (which carry `integrity`)
// never exercise.

tap.test('locker converts a legacy shasum into an sri integrity', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-lock-'))
  const savedCwd = process.cwd()
  t.teardown(() => {
    process.chdir(savedCwd)
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  })

  process.chdir(dir)
  const { default: locker } = await import('../lib/lock/locker.js')

  const tree = {
    foo: { version: '1.0.0', tarball: 'https://registry/foo.tgz', shasum: 'deadbeef' },
    // a git node carries neither integrity nor shasum
    bar: { version: '2.0.0', type: 'git', url: 'https://github.com/a/b.git#abc' }
  }
  locker({ name: 'root', version: '1.0.0' }, tree, [])

  const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8'))
  const foo = lock.packages['node_modules/foo']
  const bar = lock.packages['node_modules/bar']
  t.equal(
    foo.integrity,
    'sha1-' + Buffer.from('deadbeef', 'hex').toString('base64'),
    'a hex shasum is converted to an sha1 SRI string'
  )
  t.notOk(bar.integrity, 'a node without integrity or shasum records none')
  t.end()
})
