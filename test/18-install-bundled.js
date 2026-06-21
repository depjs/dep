import tap from 'tap'
import resolveTree from '../lib/utils/resolve-tree.js'

// bundledDependencies ship inside a package's tarball, so the resolver must not
// fetch them from the registry or place them as separate (hoisted) packages —
// while non-bundled dependencies are resolved normally.
tap.test('bundledDependencies are excluded from resolution and hoisting', async (t) => {
  const metas = {
    lib: {
      type: 'registry',
      version: '1.0.0',
      tarball: 'http://example.invalid/lib.tgz',
      dependencies: { b: '^1.0.0', n: '^1.0.0' },
      bundled: ['b']
    },
    n: { type: 'registry', version: '1.0.0', tarball: 'http://example.invalid/n.tgz' },
    b: { type: 'registry', version: '1.0.0', tarball: 'http://example.invalid/b.tgz' }
  }
  const fetched = []
  const fake = async (name) => { fetched.push(name); return metas[name] }

  global.dependenciesTree = {}
  await Promise.all([resolveTree({ lib: '^1.0.0' }, fake, {})])

  t.notOk(fetched.includes('b'), 'the bundled dependency is never fetched')
  t.ok(fetched.includes('n'), 'a non-bundled dependency is fetched')
  t.notOk(global.dependenciesTree.b, 'the bundled dependency is not placed in the tree')
  t.ok(global.dependenciesTree.n, 'the non-bundled dependency is hoisted normally')
  t.ok(global.dependenciesTree.lib, 'the bundling package itself is installed')
  t.end()
})

tap.test('bundled names are excluded across deps, peers and optionals', async (t) => {
  const meta = {
    type: 'registry',
    version: '1.0.0',
    tarball: 'http://example.invalid/lib.tgz',
    dependencies: { d: '^1.0.0' },
    peerDependencies: { p: '^1.0.0' },
    optionalDependencies: { o: '^1.0.0' },
    bundled: ['d', 'p', 'o']
  }
  const fetched = []
  const fake = async (name) => {
    fetched.push(name)
    return name === 'lib' ? meta : { type: 'registry', version: '1.0.0', tarball: 'http://example.invalid/x.tgz' }
  }

  global.dependenciesTree = {}
  await Promise.all([resolveTree({ lib: '^1.0.0' }, fake, {})])

  t.same(fetched, ['lib'], 'only the bundling package is fetched; bundled dep/peer/optional are not')
  t.same(Object.keys(global.dependenciesTree), ['lib'], 'no bundled packages are placed')
  t.end()
})
