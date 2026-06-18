import request from 'request'
import tar from 'tar-fs'
import gunzip from 'gunzip-maybe'
import npmrc from '../../utils/npmrc.js'

export default (pkg, cwd) => {
  const options = {
    url: pkg.url,
    headers: {
      'User-Agent': npmrc.userAgent
    }
  }
  return new Promise((resolve, reject) => {
    const extract = tar.extract(cwd, { strip: 1 })
    extract.on('finish', () => {
      resolve()
    })
    request.get(options)
      .pipe(gunzip())
      .pipe(extract)
      .on('error', reject)
  })
}
