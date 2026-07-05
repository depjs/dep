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

tap.test('pick-version avoids versions published past the latest tag', (t) => {
  // Mirrors @mui/joy: one-off dev prereleases sort above the tagged beta
  // ('dev' > 'beta'), but npm never picks past the latest tag while anything
  // else satisfies.
  const joy = {
    'dist-tags': { latest: '5.0.0-beta.52' },
    versions: {
      '5.0.0-beta.51': {},
      '5.0.0-beta.52': {},
      '5.0.0-dev.240424162023-9968b4889d': {}
    }
  }
  t.equal(pick(joy, '^5.0.0-beta.52'), '5.0.0-beta.52',
    'the latest tag wins over a higher-sorting dev prerelease')
  t.equal(pick(joy, '5.0.0-dev.240424162023-9968b4889d'),
    '5.0.0-dev.240424162023-9968b4889d',
    'an exactly pinned past-latest version is still honoured')

  const maintained = {
    'dist-tags': { latest: '1.9.0' },
    versions: { '1.8.0': {}, '1.9.0': {}, '2.0.0': {} }
  }
  t.equal(pick(maintained, '^1.0.0'), '1.9.0', 'latest wins when it satisfies')
  t.equal(pick(maintained, '^2.0.0'), '2.0.0',
    'a version past latest is picked when nothing else satisfies')
  t.equal(pick(maintained, '^1.8.0 <1.9.0'), '1.8.0',
    'the highest not-past-latest match is used when latest does not satisfy')
  t.end()
})
