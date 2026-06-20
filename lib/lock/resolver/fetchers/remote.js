import zlib from 'zlib'
import tar from '../../../utils/tar-stream.js'
import { fetchStream } from '../../../utils/fetch.js'

export default async (name, spec, result) => {
  const stream = await fetchStream(spec)
  return new Promise((resolve, reject) => {
    const extract = tar.extract()
    let data = ''
    extract.on('entry', (header, fileStream, cb) => {
      const file = header.name.split('/').pop()
      fileStream.on('data', (chunk) => {
        if (file === 'package.json') data += chunk
      })
      fileStream.on('end', () => {
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
      fileStream.resume()
    })
    stream.on('error', reject)
    stream
      .pipe(zlib.createGunzip()).on('error', reject)
      .pipe(extract).on('error', reject)
  })
}
