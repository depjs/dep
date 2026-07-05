import fs from 'fs'
import zlib from 'zlib'
import { PassThrough } from 'stream'
import tar from '../../../utils/tar-stream.js'

// A local tarball dependency (file:./foo.tgz): read its package.json the same
// way the remote fetcher does, but from disk. An uncompressed `.tar` skips
// the gunzip stage.
export default async (name, spec, result) => {
  const stream = fs.createReadStream(spec)
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
              type: 'file',
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
      .pipe(/\.tar$/i.test(spec) ? new PassThrough() : zlib.createGunzip()).on('error', reject)
      .pipe(extract).on('error', reject)
  })
}
