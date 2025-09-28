const tar = require('tar-stream')
const gunzip = require('gunzip-maybe')
const npmrc = require('../../../utils/npmrc')
const { pipeline } = require('node:stream/promises')
const { requestStream } = require('../../../utils/http')

module.exports = async (name, spec, result) => {
  const extract = tar.extract()
  let data = ''
  let found = false
  extract.on('entry', (header, stream, cb) => {
    const file = header.name.split('/').pop()
    if (file !== 'package.json' || found) {
      stream.on('end', cb)
      stream.resume()
      return
    }
    found = true
    stream.on('data', (chunk) => {
      data += chunk
    })
    stream.on('end', () => {
      cb()
    })
    stream.resume()
  })
  const { stream } = await requestStream(spec, {
    headers: {
      'User-Agent': npmrc.userAgent
    }
  })
  await pipeline(stream, gunzip(), extract)
  if (!data) {
    throw new Error(`Unable to read package.json from remote tarball: ${spec}`)
  }
  const pkgJSON = JSON.parse(data)
  return {
    type: 'remote',
    version: pkgJSON.version,
    dependencies: pkgJSON.dependencies,
    url: spec
  }
}
