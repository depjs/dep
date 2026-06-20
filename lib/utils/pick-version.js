import semver from './semver.js'

// Pick a version from a registry document the same way npm does: a matching
// dist-tag (e.g. `latest`, `beta`) wins, otherwise the highest version that
// satisfies the requested range. Returns the chosen version string, or
// undefined when nothing matches.
export default (body, spec) => {
  const distTags = body['dist-tags'] || {}
  if (distTags[spec]) return distTags[spec]
  if (semver.validRange(spec)) {
    const match = semver.maxSatisfying(Object.keys(body.versions || {}), spec)
    if (match) return match
  }
  return distTags.latest
}
