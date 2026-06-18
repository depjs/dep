import request from 'request'
import tar from 'tar-stream'
import gunzip from 'gunzip-maybe'
import npmrc from '../../../utils/npmrc.js'

export default (name, spec, result) => {
  const options = {
    url: spec,
    headers: {
      'User-Agent': npmrc.userAgent
    }
  }
  return new Promise((resolve, reject) => {
    const extract = tar.extract()
    let data = ''
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
