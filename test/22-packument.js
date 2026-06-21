import tap from './helpers/tap.js'
import packument from '../lib/utils/packument.js'

// Resolution downloads the abbreviated ("corgi") packument by default — much
// smaller than the full document — and only asks for the full one when locking
// (which records license/funding).
tap.test('packument requests abbreviated metadata by default and full on demand', async (t) => {
  const calls = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, accept: opts && opts.headers && opts.headers.Accept })
    return { ok: true, json: async () => ({ name: 'x' }) }
  }
  t.teardown(() => { globalThis.fetch = realFetch })

  await packument('pkg-abbr-' + Date.now())
  t.equal(calls[0].accept, 'application/vnd.npm.install-v1+json', 'default is the abbreviated format')

  await packument('pkg-full-' + Date.now(), { full: true })
  t.equal(calls[1].accept, 'application/json', 'full document requested when asked')
  t.end()
})

tap.test('packument memoises by name and format', async (t) => {
  let hits = 0
  const realFetch = globalThis.fetch
  globalThis.fetch = async () => { hits++; return { ok: true, json: async () => ({}) } }
  t.teardown(() => { globalThis.fetch = realFetch })

  const name = 'pkg-cache-' + Date.now()
  await packument(name)
  await packument(name)
  t.equal(hits, 1, 'a repeated abbreviated request is served from cache')

  await packument(name, { full: true })
  t.equal(hits, 2, 'the full format is fetched separately')
  t.end()
})
