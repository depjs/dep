import { execFileSync } from 'child_process'
import path from 'path'

const bin = path.join(import.meta.dirname, '../../node_modules/node-gyp/bin/node-gyp.js')

export default (opts) => {
  execFileSync(bin, ['--silent', 'rebuild'], opts)
}
