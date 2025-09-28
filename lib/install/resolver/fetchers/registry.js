const semver = require('semver')
const npmrc = require('../../../utils/npmrc')
const { requestJson } = require('../../../utils/http')

module.exports = async (name, spec, result) => {
  const body = await requestJson(npmrc.registry + result.escapedName, {
    headers: {
      'User-Agent': npmrc.userAgent
    }
  })
  const versions = Object.keys(body.versions)
  const version = versions.reduce((accumulator, currentValue) => {
    if (semver.satisfies(accumulator, spec)) return accumulator
    return currentValue
  }, '')
  const target = body.versions[version]
  if (!target) {
    throw new Error(`Unable to resolve ${name}@${spec || 'latest'} from registry ${npmrc.registry}`)
  }
  if (target.deprecated) {
    process.stdout.write(
      `${target.name}@${target.version}: ${target.deprecated}\n\n`
    )
  }
  return {
    type: 'registry',
    version: target.version,
    dependencies: target.dependencies,
    tarball: target.dist.tarball,
    shasum: target.dist.shasum
  }
}
