import tap from 'tap'
import pool from '../lib/utils/pool.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

tap.test('runs at most `size` tasks concurrently', async (t) => {
  const limit = pool(3)
  let active = 0
  let peak = 0

  const results = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      limit(async () => {
        active++
        peak = Math.max(peak, active)
        await delay(10)
        active--
        return i * 2
      })
    )
  )

  t.ok(peak <= 3, `peak concurrency (${peak}) never exceeded the limit`)
  t.ok(peak > 1, 'tasks actually ran in parallel up to the limit')
  t.same(results, Array.from({ length: 12 }, (_, i) => i * 2), 'every task resolved with its own result')
  t.end()
})

tap.test('a failing task rejects only its own promise and frees its slot', async (t) => {
  const limit = pool(2)

  await t.rejects(limit(() => Promise.reject(new Error('boom'))), /boom/, 'rejection propagates')

  // The pool keeps working after a failure.
  const value = await limit(() => Promise.resolve('ok'))
  t.equal(value, 'ok', 'subsequent tasks still run')
  t.end()
})

tap.test('a task that throws synchronously is caught', async (t) => {
  const limit = pool(1)
  await t.rejects(limit(() => { throw new Error('sync') }), /sync/, 'sync throw becomes a rejection')
  t.equal(await limit(() => Promise.resolve(1)), 1, 'pool is not wedged')
  t.end()
})
