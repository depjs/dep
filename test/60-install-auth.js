import fs from 'fs'
import os from 'os'
import path from 'path'
import http from 'http'
import zlib from 'zlib'
import { exec } from 'child_process'
import tap from './helpers/tap.js'

const bin = path.join(import.meta.dirname, '..', 'bin', 'dep.js')
const TOKEN = 'hunter2-token'

// Minimal one-file tarball for the fake package — the tar parser only reads
// name/size/type, so no checksum/magic is needed (see 44-tar-fs.js).
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
const tgz = zlib.gzipSync(Buffer.concat([
  entry('package/package.json', JSON.stringify({ name: 'authpkg', version: '1.0.0' })),
  Buffer.alloc(BLOCK * 2)
]))

// A one-package registry serving metadata and the tarball. Records the
// Authorization header of every request; optionally rejects requests that
// don't carry the expected token.
const registry = (requireAuth) => new Promise((resolve) => {
  const seen = []
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, auth: req.headers.authorization })
    if (requireAuth && req.headers.authorization !== `Bearer ${TOKEN}`) {
      res.writeHead(401)
      return res.end('unauthorized')
    }
    const base = `http://127.0.0.1:${server.address().port}`
    if (req.url === '/authpkg') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({
        name: 'authpkg',
        'dist-tags': { latest: '1.0.0' },
        versions: {
          '1.0.0': {
            name: 'authpkg',
            version: '1.0.0',
            dist: { tarball: `${base}/authpkg/-/authpkg-1.0.0.tgz` }
          }
        }
      }))
    }
    if (req.url === '/authpkg/-/authpkg-1.0.0.tgz') {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
      return res.end(tgz)
    }
    res.writeHead(404)
    res.end()
  })
  server.listen(0, '127.0.0.1', () =>
    resolve({ server, seen, port: server.address().port }))
})

// A scratch project depending on authpkg, plus a scratch home whose .npmrc
// holds the given lines — the child dep process resolves it via os.homedir().
const mkProject = (t, npmrcLines) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-auth-h-'))
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-auth-p-'))
  fs.writeFileSync(path.join(dir, 'package.json'),
    JSON.stringify({ name: 't', version: '1.0.0', dependencies: { authpkg: '^1.0.0' } }))
  fs.writeFileSync(path.join(home, '.npmrc'), npmrcLines.join('\n') + '\n')
  t.teardown(() => {
    fs.rmSync(home, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  })
  // os.homedir() reads %USERPROFILE% on Windows, $HOME elsewhere: set both.
  const env = { ...process.env, HOME: home, USERPROFILE: home, NO_UPDATE_NOTIFIER: '1' }
  return { dir, env }
}

tap.test('install authenticates metadata and tarball requests with _authToken', async (t) => {
  const { server, seen, port } = await registry(true)
  t.teardown(() => server.close())
  const { dir, env } = mkProject(t, [
    `registry=http://127.0.0.1:${port}/`,
    `//127.0.0.1:${port}/:_authToken=${TOKEN}`
  ])

  await new Promise((resolve) => {
    exec(`node ${bin} install`, { cwd: dir, env }, (err) => {
      t.error(err, 'install succeeds against the authed registry')
      t.ok(fs.existsSync(path.join(dir, 'node_modules', 'authpkg', 'package.json')),
        'the package is extracted')
      t.ok(seen.some((r) => r.url === '/authpkg'), 'metadata was requested')
      t.ok(seen.some((r) => r.url.endsWith('.tgz')), 'the tarball was requested')
      t.ok(seen.every((r) => r.auth === `Bearer ${TOKEN}`),
        'every request carried the Bearer token')
      resolve()
    })
  })
  t.end()
})

tap.test('a 401 without a configured token fails with the npmrc hint', async (t) => {
  const { server, port } = await registry(true)
  t.teardown(() => server.close())
  const { dir, env } = mkProject(t, [`registry=http://127.0.0.1:${port}/`])

  await new Promise((resolve) => {
    exec(`node ${bin} install`, { cwd: dir, env }, (err, stdout, stderr) => {
      t.ok(err, 'install exits non-zero')
      t.match(stderr, /status 401/, 'reports the status')
      t.match(stderr, /\/\/<registry-host>\/:_authToken=<token>/, 'includes the npmrc hint')
      t.notOk(fs.existsSync(path.join(dir, 'node_modules', 'authpkg')),
        'nothing is extracted')
      resolve()
    })
  })
  t.end()
})

tap.test('a token for another host is never sent', async (t) => {
  const { server, seen, port } = await registry(false)
  t.teardown(() => server.close())
  const { dir, env } = mkProject(t, [
    `registry=http://127.0.0.1:${port}/`,
    `//registry.elsewhere.example.com/:_authToken=${TOKEN}`
  ])

  await new Promise((resolve) => {
    exec(`node ${bin} install`, { cwd: dir, env }, (err) => {
      t.error(err, 'install succeeds against the open registry')
      t.ok(seen.length > 0, 'the registry served requests')
      t.ok(seen.every((r) => r.auth === undefined),
        'no request carried an Authorization header')
      resolve()
    })
  })
  t.end()
})
