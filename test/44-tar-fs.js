import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import tap from './helpers/tap.js'
import { extract } from '../lib/utils/tar-fs.js'

// tar-fs.extract writes each tar entry to disk. Drive it with a real archive
// containing a directory, a regular file and a symlink so the per-type branches
// (and the `strip` prefix dropping) are all exercised.

tap.test('tar-fs extracts dirs, files and symlinks and applies strip', (t) => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-src-'))
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-dest-'))
  t.teardown(() => {
    fs.rmSync(src, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    fs.rmSync(dest, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  })

  // package/            (dir, type 5)
  // package/index.js    (file, type 0)
  // package/sub/        (dir, type 5)
  // package/link.js     (symlink -> index.js, type 2)
  fs.mkdirSync(path.join(src, 'package', 'sub'), { recursive: true })
  fs.writeFileSync(path.join(src, 'package', 'index.js'), 'module.exports = 1\n')
  fs.symlinkSync('index.js', path.join(src, 'package', 'link.js'))

  const tarball = path.join(src, 'archive.tar')
  execFileSync('tar', ['cf', tarball, '-C', src, 'package'])
  const buf = fs.readFileSync(tarball)

  const parser = extract(dest, { strip: 1 })
  parser.on('error', (e) => { t.error(e, 'extract emitted no error'); t.end() })
  parser.on('finish', () => {
    t.equal(fs.readFileSync(path.join(dest, 'index.js'), 'utf8'), 'module.exports = 1\n',
      'file extracted with the leading path segment stripped')
    t.ok(fs.statSync(path.join(dest, 'sub')).isDirectory(), 'directory entry extracted')
    t.equal(fs.readlinkSync(path.join(dest, 'link.js')), 'index.js', 'symlink entry extracted')
    t.end()
  })
  parser.end(buf)
})
