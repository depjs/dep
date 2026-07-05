import fs from 'fs'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')

// Minimal tarball built in-process (the tar parser only reads name/size/type,
// see 44-tar-fs.js) so the test doesn't depend on a host `tar`.
const BLOCK = 512
const entry = (name, content) => {
  const body = Buffer.from(content)
  const header = Buffer.alloc(BLOCK)
  header.write(name, 0, 100)
  header.write('0000644', 100, 7)
  header.write(body.length.toString(8).padStart(11, '0'), 124, 11)
  header[156] = '0'.charCodeAt(0)
  const pad = Buffer.alloc(Math.ceil(body.length / BLOCK) * BLOCK - body.length)
  return Buffer.concat([header, body, pad])
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-file-tgz-'))
fs.writeFileSync(path.join(dir, 'tgz-pkg.tgz'), zlib.gzipSync(Buffer.concat([
  entry('package/package.json', JSON.stringify({ name: 'tgz-pkg', version: '3.0.0' })),
  entry('package/index.js', 'module.exports = "tgz"\n'),
  Buffer.alloc(BLOCK * 2)
])))
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
  name: 't', version: '1.0.0', dependencies: { 'tgz-pkg': 'file:./tgz-pkg.tgz' }
}))

const installed = () => {
  try {
    return JSON.parse(fs.readFileSync(
      path.join(dir, 'node_modules', 'tgz-pkg', 'package.json'))).version
  } catch (e) {
    return undefined
  }
}

tap.test('a local tarball dep installs, locks, and reinstalls from the lock', (t) => {
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }))

  exec(`node ${bin} install`, { cwd: dir }, (err) => {
    t.error(err, 'fresh install ran without error')
    t.equal(installed(), '3.0.0', 'the tarball is extracted into node_modules')

    exec(`node ${bin} lock`, { cwd: dir }, (err2) => {
      t.error(err2, 'lock ran without error')
      const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json')))
      t.match(lock.packages['node_modules/tgz-pkg'].resolved, /\.tgz$/,
        'the lockfile records the tarball path')

      fs.rmSync(path.join(dir, 'node_modules'), { recursive: true, force: true })
      exec(`node ${bin} install`, { cwd: dir }, (err3, stdout) => {
        t.error(err3, 'lock-driven install ran without error')
        t.match(stdout, /Using package-lock\.json/, 'install reports it used the lockfile')
        t.equal(installed(), '3.0.0', 'the tarball is extracted again from the lock')
        t.end()
      })
    })
  })
})
