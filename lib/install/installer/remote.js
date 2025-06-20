const request = require('request')
const tar = require('tar-fs')
const gunzip = require('gunzip-maybe')
const npmrc = require('../../utils/npmrc')

module.exports = (pkg, cwd) => {
  const options = {
    url: pkg.url,
    headers: {
      'User-Agent': npmrc.userAgent
    }
  }
  return new Promise((resolve, reject) => {
    const extract = tar.extract(cwd, {
      strip: 1,
      ignore: (_, header) => header.type !== 'file' && header.type !== 'directory'
    })
    extract.on('finish', () => {
      resolve()
    })
    request.get(options)
      .pipe(gunzip())
      .pipe(extract)
      .on('error', reject)
  })
}
