const request = require('request')
const tar = require('tar-stream')
const gunzip = require('gunzip-maybe')
const npmrc = require('../../../utils/npmrc')

module.exports = (name, spec, result) => {
  const options = {
    url: spec,
    headers: {
      'User-Agent': npmrc.userAgent
    }
  }
  return new Promise((resolve, reject) => {
    const extract = tar.extract()
    var data = ''
    extract.on('entry', (header, stream, cb) => {
      const file = header.name.split('/').pop()
      stream.on('data', (chunk) => {
        if (file === 'package.json') data += chunk
      })
      stream.on('end', () => {
        if (data) {
          try {
            const pkgJSON = JSON.parse(data)
            resolve({
              type: 'remote',
              version: pkgJSON.version,
              dependencies: pkgJSON.dependencies,
              url: spec
            })
          } catch (e) { reject(e) }
        } else {
          cb()
        }
      })
      stream.resume()
    })
    request.get(options)
      .pipe(gunzip())
      .pipe(extract)
      .on('error', reject)
  })
}
