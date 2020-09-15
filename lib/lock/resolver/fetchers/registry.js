const request = require('request')
const semver = require('semver')
const npmrc = require('../../../utils/npmrc')

module.exports = (name, spec, result) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: npmrc.registry + result.escapedName,
      headers: {
        'User-Agent': npmrc.userAgent
      }
    }
    var body = ''
    request.get(options)
      .on('data', (chunk) => { body += chunk })
      .on('end', () => {
        try {
          body = JSON.parse(body)
          const versions = Object.keys(body.versions)
          const version = versions.reduce((accumulator, currentValue) => {
            if (semver.satisfies(accumulator, spec)) return accumulator
            return currentValue
          }, '')
          const target = body.versions[version]
          if (target.deprecated) {
            process.stdout.write(
              `${target.name}@${target.version}: ${target.deprecated}\n\n`
            )
          }
          resolve({
            type: 'registry',
            version: target.version,
            dependencies: target.dependencies,
            tarball: target.dist.tarball,
            shasum: target.dist.shasum
          })
        } catch (e) { return reject(e) }
      })
      .on('error', reject)
  })
}
