const request = require('request')
const npmrc = require('../../../utils/npmrc')

module.exports = (name, spec, result) => {
  if (spec.match(/^[0-9]/)) spec = 'v' + spec
  return new Promise((resolve, reject) => {
    const options = {
      url: npmrc.registry + result.escapedName + '/' + spec,
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
          if (body.deprecated) {
            process.stdout.write(
              `${body.name}@${body.version}: ${body.deprecated}\n\n`
            )
          }
          resolve({
            type: 'registry',
            version: body.version,
            dependencies: body.dependencies,
            tarball: body.dist.tarball,
            shasum: body.dist.shasum
          })
        } catch (e) { return reject(e) }
      })
      .on('error', reject)
  })
}
