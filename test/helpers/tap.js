// A tiny tap-compatible shim over Node's built-in test runner, so the test
// suite keeps its familiar `tap.test`/`t.ok` API with zero dev dependencies.
import { test } from 'node:test'
import assert from 'node:assert'

function run (name, opts, fn) {
  const body = (ctx) => new Promise((resolve, reject) => {
    let planned = null
    let count = 0
    let done = false
    const teardowns = []

    const finish = (err) => {
      if (done) return
      done = true
      teardowns
        .reduceRight((p, td) => p.then(() => td()).catch(() => {}), Promise.resolve())
        .then(() => err ? reject(err) : resolve())
    }
    const pass = () => {
      count++
      if (planned !== null && count >= planned) finish()
    }
    const fail = (message, extra) =>
      finish(new assert.AssertionError({ message: message || 'assertion failed', ...extra }))
    // tap's `same` ignores properties whose value is undefined; deepEqual does
    // not, so prune them away before comparing.
    const prune = (v) => {
      if (Array.isArray(v)) return v.map(prune)
      if (v && typeof v === 'object') {
        const o = {}
        for (const k of Object.keys(v)) if (v[k] !== undefined) o[k] = prune(v[k])
        return o
      }
      return v
    }
    const matchRe = (value, exp, message, operator) => {
      if (!(exp instanceof RegExp)) return pass()
      const str = typeof value === 'string' ? value : (value && value.message) || String(value)
      return exp.test(str) ? pass() : fail(message, { actual: str, expected: exp, operator })
    }

    const t = {
      ok: (v, m) => v ? pass() : fail(m, { actual: v, operator: 'ok' }),
      notOk: (v, m) => !v ? pass() : fail(m, { actual: v, operator: 'notOk' }),
      error: (e, m) => !e ? pass() : fail(m || 'expected no error', { actual: e, operator: 'error' }),
      equal: (a, b, m) => Object.is(a, b) ? pass() : fail(m, { actual: a, expected: b, operator: 'equal' }),
      same: (a, b, m) => {
        try { assert.deepEqual(prune(a), prune(b)); pass() } catch (e) { fail(m, { actual: a, expected: b, operator: 'same' }) }
      },
      match: (a, b, m) => matchRe(a, b, m, 'match'),
      throws: (fn2, exp, m) => {
        try { fn2() } catch (e) { return matchRe(e, exp, m, 'throws') }
        fail(m || 'expected to throw', { operator: 'throws' })
      },
      doesNotThrow: (fn2, m) => {
        try { fn2(); pass() } catch (e) { fail(m || 'expected not to throw', { actual: e, operator: 'doesNotThrow' }) }
      },
      rejects: async (p, exp, m) => {
        try { await (typeof p === 'function' ? p() : p) } catch (e) { return matchRe(e, exp, m, 'rejects') }
        fail(m || 'expected to reject', { operator: 'rejects' })
      },
      pass: (m) => pass(),
      skip: (m) => { try { ctx.skip(m) } catch (e) {} finish() },
      plan: (n) => { planned = n; if (count >= n) finish() },
      teardown: (fn2) => teardowns.push(fn2),
      end: () => finish()
    }

    let r
    try { r = fn(t) } catch (e) { finish(e); return }
    if (r && typeof r.then === 'function') r.then(() => {}, (e) => finish(e))
  })

  return test(name, opts, body)
}

let anon = 0
const tap = {
  test (a, b, c) {
    if (typeof a === 'function') return run(`test ${++anon}`, {}, a)
    if (typeof b === 'function') return run(a, {}, b)
    return run(a, b || {}, c)
  }
}

export default tap
