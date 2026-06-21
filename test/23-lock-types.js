import path from 'path'
import tap from './helpers/tap.js'
import lockFetch from '../lib/lock/resolver/fetcher.js'
import localFetch from '../lib/lock/resolver/fetchers/local.js'

// The lock resolver dispatches each dependency to a per-type fetcher
// (git / remote / local / registry). The registry path is covered end to end by
// 20-lock; here we drive the dispatcher directly so the git, remote and local
// lock fetchers — including git's HEAD / committish / semver branches — are
// exercised in-process (a `dep lock` child process would not be instrumented).

const repo = 'git+https://github.com/watilde/happy-birthday.git'
const fileDep = path.join(import.meta.dirname, 'deps', 'file', 'happy-birthday-0.6.0')

tap.test('lock resolves a git dependency without a committish (HEAD)', async (t) => {
  const r = await lockFetch('happy-birthday', repo)
  t.equal(r.type, 'git', 'resolved as a git dependency')
  t.ok(r.version, 'has a version from the fetched package.json')
  t.match(r.url, /happy-birthday\.git#[0-9a-f]+$/, 'url pins the HEAD committish')
  t.end()
})

tap.test('lock resolves a git dependency at an explicit committish', async (t) => {
  const r = await lockFetch('happy-birthday', `${repo}#70e05f`)
  t.equal(r.type, 'git', 'resolved as a git dependency')
  t.match(r.url, /#70e05f/, 'url keeps the requested committish')
  t.end()
})

tap.test('lock resolves a git committish that matches a tag to its commit', async (t) => {
  const r = await lockFetch('happy-birthday', `${repo}#0.6.0`)
  t.equal(r.type, 'git', 'resolved as a git dependency')
  t.match(r.url, /\.git#[0-9a-f]{6,}$/, 'a matching tag is pinned to its full commit sha')
  t.end()
})

tap.test('lock resolves a git dependency by a semver tag range', async (t) => {
  const r = await lockFetch('happy-birthday', `${repo}#semver:^0.5.0`)
  t.equal(r.type, 'git', 'resolved as a git dependency')
  t.match(r.version, /^0\.5\./, 'a tag satisfying the range is chosen')
  t.match(r.url, /happy-birthday\.git#/, 'url pins the matched commit')
  t.end()
})

tap.test('lock resolves a deprecated registry dependency and reports it', async (t) => {
  const r = await lockFetch('minimatch', '0.0.1')
  t.equal(r.type, 'registry', 'resolved as a registry dependency')
  t.equal(r.version, '0.0.1', 'the requested version is locked')
  t.ok(r.tarball, 'records the tarball url')
  t.end()
})

tap.test('lock resolves a remote tarball dependency', async (t) => {
  const url = 'https://github.com/watilde/happy-birthday/archive/0.6.0.tar.gz'
  const r = await lockFetch('happy-birthday', url)
  t.equal(r.type, 'remote', 'resolved as a remote dependency')
  t.equal(r.version, '0.6.0', 'version read from the tarball package.json')
  t.equal(r.url, url, 'url is the tarball url')
  t.end()
})

tap.test('lock resolves a local file: dependency', async (t) => {
  const r = await lockFetch('happy-birthday', `file:${fileDep}`)
  t.equal(r.type, 'local', 'resolved as a local dependency')
  t.equal(r.version, '0.6.0', 'version read from the local package.json')
  t.equal(r.url, fileDep, 'url points at the local path')
  t.end()
})

tap.test('lock accepts a local spec that already points at package.json', async (t) => {
  const r = await localFetch('happy-birthday', path.join(fileDep, 'package.json'), {})
  t.equal(r.version, '0.6.0', 'reads the file directly without appending package.json')
  t.equal(r.url, path.join(fileDep, 'package.json'), 'url is the given spec')
  t.end()
})

tap.test('lock rejects when a local dependency cannot be read', async (t) => {
  await t.rejects(
    localFetch('happy-birthday', path.join(fileDep, 'does-not-exist'), {}),
    /ENOENT/,
    'a missing package.json surfaces the read error'
  )
  t.end()
})
