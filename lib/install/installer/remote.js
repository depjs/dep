const tar = require('tar-fs')
const gunzip = require('gunzip-maybe')
const npmrc = require('../../utils/npmrc')
const { pipeline } = require('node:stream/promises')
const { requestStream } = require('../../utils/http')

module.exports = async (pkg, cwd) => {
  const extract = tar.extract(cwd, { strip: 1 })
  const { stream } = await requestStream(pkg.url, {
    headers: {
      'User-Agent': npmrc.userAgent
    }
  })
  await pipeline(stream, gunzip(), extract)
}
