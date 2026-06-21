import tap from './helpers/tap.js'
import resolveTree from '../lib/utils/resolve-tree.js'
import parseOverrides from '../lib/utils/overrides.js'

// Fixed metadata graph: root -> a, b; both a and b -> c.
const metas = {
  'a@^1.0.0': { type: 'registry', version: '1.0.0', tarball: 'x', dependencies: { c: '^1.0.0' } },
  'b@^1.0.0': { type: 'registry', version: '1.0.0', tarball: 'x', dependencies: { c: '^1.0.0' } },
  'c@^1.0.0': { type: 'registry', version: '1.0.0', tarball: 'x' },
  'c@2.0.0': { type: 'registry', version: '2.0.0', tarball: 'x' }
}
const fetcher = async (n, s) => {
  const m = metas[`${n}@${s}`]
  if (!m) throw new Error(`no meta for ${n}@${s}`)
  return m
}

const resolve = async (overridesObj) => {
  global.dependenciesTree = {}
  const root = { dependencies: { a: '^1.0.0', b: '^1.0.0' }, overrides: overridesObj }
  const overrides = parseOverrides(overridesObj, root)
  await Promise.all([resolveTree(root.dependencies, fetcher, { overrides })])
  const t = global.dependenciesTree
  return {
    topC: t.c && t.c.version,
    cUnderA: t.a && t.a.dependencies && t.a.dependencies.c && t.a.dependencies.c.version,
    cUnderB: t.b && t.b.dependencies && t.b.dependencies.c && t.b.dependencies.c.version
  }
}

tap.test('no overrides: a shared dependency is hoisted once', async (t) => {
  t.same(await resolve(undefined), { topC: '1.0.0' }, 'c@1 hoisted, no nesting')
  t.end()
})

tap.test('a global override forces a name everywhere', async (t) => {
  t.same(await resolve({ c: '2.0.0' }), { topC: '2.0.0' }, 'every c becomes 2.0.0')
  t.end()
})

tap.test('a parent-scoped override only affects that parent', async (t) => {
  const r = await resolve({ a: { c: '2.0.0' } })
  t.equal(r.cUnderA || r.topC, '2.0.0', "a's c is forced to 2.0.0")
  t.equal(r.cUnderB || r.topC, r.topC === '2.0.0' ? '1.0.0' : r.cUnderB, "b's c is left alone")
  // Concretely: a resolves c@2, b resolves c@1.
  t.ok(r.topC === '2.0.0' && r.cUnderB === '1.0.0', 'a -> c@2 (hoisted), b -> c@1 (nested)')
  t.end()
})

tap.test('a $-reference reuses the root spec', async (t) => {
  // c: "$a" -> root's spec for a ("^1.0.0") -> c resolves to 1.0.0
  t.same(await resolve({ c: '$a' }), { topC: '1.0.0' }, 'c uses the spec declared for a')
  t.end()
})

tap.test('parseOverrides ignores version-qualified keys', (t) => {
  const map = parseOverrides({ 'foo@2': { bar: '1.0.0' }, baz: '3.0.0' }, {})
  t.notOk(map.has('foo@2'), 'version-qualified target is ignored')
  t.ok(map.has('baz'), 'plain target is kept')
  t.end()
})
