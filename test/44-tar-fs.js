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

tap.test('tar-fs handles GNU long names and long link targets', (t) => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-src-'))
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-out-'))
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-dest-'))
  t.teardown(() => {
    for (const d of [src, out, dest]) fs.rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  })

  // Names/targets over 100 bytes force GNU 'L'/'K' extended-header entries.
  const longName = path.join('d'.repeat(120), 'f'.repeat(120) + '.js')
  fs.mkdirSync(path.join(src, path.dirname(longName)), { recursive: true })
  fs.writeFileSync(path.join(src, longName), 'x\n')
  fs.symlinkSync('t'.repeat(130), path.join(src, 'longlink'))

  const tarball = path.join(out, 'archive.tar')
  execFileSync('tar', ['cf', tarball, '--format=gnu', '-C', src, '.'])

  const parser = extract(dest, {})
  parser.on('error', (e) => { t.error(e, 'extract emitted no error'); t.end() })
  parser.on('finish', () => {
    t.equal(fs.readFileSync(path.join(dest, longName), 'utf8'), 'x\n', 'long file name (GNU L) extracted')
    t.equal(fs.readlinkSync(path.join(dest, 'longlink')).length, 130, 'long symlink target (GNU K) extracted')
    t.end()
  })
  parser.end(fs.readFileSync(tarball))
})

tap.test('tar-fs surfaces a write failure as a stream error', (t) => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-src-'))
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tar-dest-'))
  t.teardown(() => {
    fs.rmSync(src, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    fs.rmSync(dest, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  })

  // A plain file already sits where the archive needs a directory, so creating
  // foo/bar.js must fail — the parser should emit that as an `error`.
  fs.writeFileSync(path.join(dest, 'foo'), 'i am a file, not a directory\n')
  fs.mkdirSync(path.join(src, 'foo'))
  fs.writeFileSync(path.join(src, 'foo', 'bar.js'), 'x\n')
  const tarball = path.join(src, 'archive.tar')
  execFileSync('tar', ['cf', tarball, '-C', src, 'foo'])

  const parser = extract(dest, {})
  parser.on('finish', () => { t.ok(false, 'expected an error, not a clean finish'); t.end() })
  parser.on('error', (e) => {
    t.ok(e, 'a write failure is surfaced as an error')
    t.end()
  })
  parser.end(fs.readFileSync(tarball))
})
