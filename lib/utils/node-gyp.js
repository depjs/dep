const { execFileSync } = require('child_process')
const path = require('path')
const bin = path.join(__dirname, '../../node_modules/.bin/node-gyp')

module.exports = (opts) => {
  execFileSync(bin, ['--silent', 'rebuild'], opts)
}
