import tap from './helpers/tap.js'
import semver from '../lib/utils/semver.js'

// Targeted checks for the corners of the inlined semver: prerelease ordering,
// hyphen ranges and x-ranges (including the 0.x caret-like widening).

tap.test('semver compares prerelease identifiers', (t) => {
  t.ok(semver.gt('1.0.0-alpha.2', '1.0.0-alpha.1'), 'numeric prerelease ids order')
  t.ok(semver.gt('1.0.0-beta', '1.0.0-alpha'), 'alphabetic prerelease ids order')
  t.ok(semver.gt('1.0.0', '1.0.0-rc.1'), 'a release outranks its prerelease')
  t.notOk(semver.gt('1.0.0-alpha.1', '1.0.0-alpha.1'), 'equal prereleases are not greater')
  t.end()
})

tap.test('semver satisfies hyphen ranges', (t) => {
  t.ok(semver.validRange('1.2.3 - 2.3.4'), 'hyphen range is valid')
  t.ok(semver.satisfies('1.5.0', '1.2.3 - 2.3.4'), 'inside the hyphen range')
  t.notOk(semver.satisfies('2.4.0', '1.2.3 - 2.3.4'), 'above the hyphen range')
  t.end()
})

tap.test('semver satisfies x-ranges', (t) => {
  t.ok(semver.satisfies('0.5.9', '0.5.x'), '0.5.x admits a matching patch (0.x widening)')
  t.notOk(semver.satisfies('0.6.0', '0.5.x'), '0.5.x excludes the next minor')
  t.ok(semver.satisfies('1.5.9', '1.5.x'), '1.5.x admits a matching patch (non-zero major)')
  t.notOk(semver.satisfies('2.0.0', '1.5.x'), '1.5.x excludes the next major')
  t.ok(semver.satisfies('1.4.0', '1.x'), '1.x admits any minor')
  t.ok(semver.satisfies('3.1.4', '*'), 'a bare star admits anything')
  t.end()
})

tap.test('semver satisfies caret ranges with an x in the patch', (t) => {
  t.ok(semver.satisfies('0.5.9', '^0.5.x'), '^0.5.x widens within the minor (0.x)')
  t.notOk(semver.satisfies('0.6.0', '^0.5.x'), '^0.5.x excludes the next minor')
  t.ok(semver.satisfies('1.5.9', '^1.5.x'), '^1.5.x widens within the major')
  t.notOk(semver.satisfies('2.0.0', '^1.5.x'), '^1.5.x excludes the next major')
  t.end()
})

tap.test('semver maxSatisfying picks the highest in range', (t) => {
  const versions = ['1.0.0', '1.2.0', '1.9.0', '2.0.0']
  t.equal(semver.maxSatisfying(versions, '^1.0.0'), '1.9.0', 'highest 1.x is chosen')
  t.equal(semver.maxSatisfying(versions, '^5.0.0'), null, 'no match returns null')
  t.end()
})
