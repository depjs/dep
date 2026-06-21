import tap from './helpers/tap.js'
import resolveTree from '../lib/utils/resolve-tree.js'

// resolveTree treats `npm:other@range` aliases by comparing an already-hoisted
// version against the *target's* range. Two dependents requesting the same
// aliased name force that conflict check, exercising the alias range extraction
// for both a ranged alias (`npm:is-odd@^3.0.0`) and a bare one (`npm:is-even`).

const metas = {
  'a@^1.0.0': { type: 'registry', version: '1.0.0', tarball: 'x', dependencies: { odd: 'npm:is-odd@^3.0.0', ev: 'npm:is-even' } },
  'b@^1.0.0': { type: 'registry', version: '1.0.0', tarball: 'x', dependencies: { odd: 'npm:is-odd@^3.0.0', ev: 'npm:is-even' } },
  'odd@npm:is-odd@^3.0.0': { type: 'registry', version: '3.0.0', tarball: 'x', dependencies: {} },
  'ev@npm:is-even': { type: 'registry', version: '1.0.0', tarball: 'x', dependencies: {} }
}
const fetcher = async (name, spec) => {
  const m = metas[`${name}@${spec}`]
  if (!m) throw new Error(`no meta for ${name}@${spec}`)
  return m
}

tap.test('resolveTree hoists aliases shared by two dependents', async (t) => {
  global.dependenciesTree = {}
  await Promise.all([resolveTree({ a: '^1.0.0', b: '^1.0.0' }, fetcher, {})])

  const tree = global.dependenciesTree
  t.equal(tree.odd.version, '3.0.0', 'ranged alias resolved and hoisted once')
  t.equal(tree.ev.version, '1.0.0', 'bare alias resolved and hoisted once')
  t.notOk(tree.a.dependencies && tree.a.dependencies.odd, 'no duplicate nesting under the first dependent')
  t.end()
})
