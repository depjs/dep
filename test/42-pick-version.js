import tap from './helpers/tap.js'
import pick from '../lib/utils/pick-version.js'

// pickVersion mirrors npm: a dist-tag wins, else the highest version satisfying
// the range, else it falls back to the `latest` tag.

const body = {
  'dist-tags': { latest: '2.0.0', beta: '3.0.0-beta.1' },
  versions: { '1.0.0': {}, '1.5.0': {}, '2.0.0': {}, '3.0.0-beta.1': {} }
}

tap.test('pick-version returns the dist-tag when the spec names one', (t) => {
  t.equal(pick(body, 'beta'), '3.0.0-beta.1', 'a named dist-tag wins')
  t.equal(pick(body, 'latest'), '2.0.0', 'latest resolves to its tagged version')
  t.end()
})

tap.test('pick-version returns the highest version satisfying a range', (t) => {
  t.equal(pick(body, '^1.0.0'), '1.5.0', 'maxSatisfying within the range')
  t.end()
})

tap.test('pick-version falls back to latest when nothing matches', (t) => {
  t.equal(pick(body, '^9.0.0'), '2.0.0', 'unsatisfiable range falls back to latest')
  t.equal(pick(body, 'no-such-tag'), '2.0.0', 'an unknown tag/spec falls back to latest')
  t.end()
})

tap.test('pick-version tolerates a document without tags or versions', (t) => {
  t.equal(pick({}, '^1.0.0'), undefined, 'no dist-tags and no versions yields undefined')
  t.end()
})
