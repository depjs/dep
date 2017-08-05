const execFileSync = require('child_process').execFileSync
const path = require('path')
const bin = path.join(__dirname, '../../node_modules/node-gyp/bin/node-gyp.js')

module.exports = (opts) => {
  execFileSync(bin, ['--silent', 'rebuild'], opts)
}
