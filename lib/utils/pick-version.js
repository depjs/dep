import semver from './semver.js'

// Pick a version from a registry document the same way npm does: a matching
// dist-tag (e.g. `latest`, `beta`) wins; otherwise, among the versions that
// satisfy the range, npm's pick-manifest preference applies — the version
// tagged `latest` when it satisfies, then the highest satisfying version not
// published past `latest`, and only as a last resort anything newer (this
// keeps one-off dev/canary prereleases, which sort above a tagged beta, from
// beating the tag). Returns the chosen version string, or undefined when
// nothing matches.
export default (body, spec) => {
  const distTags = body['dist-tags'] || {}
  if (distTags[spec]) return distTags[spec]
  if (semver.validRange(spec)) {
    const versions = Object.keys(body.versions || {})
    const latest = distTags.latest
    if (latest && semver.satisfies(latest, spec)) return latest
    const notPastLatest = latest ? versions.filter((v) => !semver.gt(v, latest)) : versions
    const match = semver.maxSatisfying(notPastLatest, spec) ||
      semver.maxSatisfying(versions, spec)
    if (match) return match
  }
  return distTags.latest
}
