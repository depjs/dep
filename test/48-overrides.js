import tap from './helpers/tap.js'
import parseOverrides from '../lib/utils/overrides.js'

// parseOverrides turns a package.json `overrides` field into a Map of rule
// nodes ({ version?, children? }), with `$name` dereferenced to the root spec.

tap.test('parseOverrides reads a plain version override', (t) => {
  const rules = parseOverrides({ foo: '1.2.3' }, {})
  t.equal(rules.get('foo').version, '1.2.3', 'a string value forces the version')
  t.end()
})

tap.test('parseOverrides reads a self-version via the "." key', (t) => {
  const rules = parseOverrides({ foo: { '.': '1.2.3' } }, {})
  t.equal(rules.get('foo').version, '1.2.3', '"." sets the package own version')

  const ignored = parseOverrides({ foo: { '.': { nested: 1 } } }, {})
  t.notOk(ignored.get('foo').version, 'a non-string "." is ignored')
  t.end()
})

tap.test('parseOverrides nests child rules', (t) => {
  const rules = parseOverrides({ parent: { child: '1.2.3' } }, {})
  const parent = rules.get('parent')
  t.ok(parent.children, 'parent has children')
  t.equal(parent.children.get('child').version, '1.2.3', 'child version forced only under parent')
  t.end()
})

tap.test('parseOverrides dereferences a $spec to the root spec', (t) => {
  const root = { dependencies: { bar: '^2.0.0' } }
  const rules = parseOverrides({ foo: '$bar' }, root)
  t.equal(rules.get('foo').version, '^2.0.0', '$bar resolves to the root spec for bar')

  const dangling = parseOverrides({ foo: '$missing' }, root)
  t.equal(dangling.get('foo').version, '$missing', 'an unknown $ref is left untouched')
  t.end()
})

tap.test('parseOverrides ignores version-qualified targets and non-objects', (t) => {
  const rules = parseOverrides({ 'foo@2': '1.2.3', bar: '1.0.0' }, {})
  t.notOk(rules.has('foo@2'), 'a versioned target is skipped')
  t.ok(rules.has('bar'), 'a plain target is kept')
  t.equal(parseOverrides(undefined, {}).size, 0, 'no overrides yields an empty map')
  t.end()
})
