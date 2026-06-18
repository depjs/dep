import request from 'request'
import npmrc from '../../../utils/npmrc.js'
import pickVersion from '../../../utils/pick-version.js'

export default (name, spec, result) => {
  return new Promise((resolve, reject) => {
    const options = {
      url: npmrc.registry + result.escapedName,
      headers: {
        'User-Agent': npmrc.userAgent
      }
    }
    let body = ''
    request.get(options)
      .on('data', (chunk) => { body += chunk })
      .on('end', () => {
        try {
          body = JSON.parse(body)
          const version = pickVersion(body, spec)
          const target = version && body.versions[version]
          if (!target) {
            return reject(new Error(`No matching version found for ${name}@${spec}`))
          }
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
            shasum: target.dist.shasum,
            integrity: target.dist.integrity
          })
        } catch (e) { return reject(e) }
      })
      .on('error', reject)
  })
}
