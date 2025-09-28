const path = require('path')
const fs = require('fs')
const os = require('os')
const version = require(path.join(__dirname, '../../package.json')).version
const defaultrc = {
  userAgent: `dep/${version} node/${process.version}`,
  registry: 'https://registry.yarnpkg.com/',
  'save-prefix': '^'
}

const npmrc = {}
const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir() || process.cwd()
const npmrcPath = path.join(homeDir, '.npmrc')
const npmrcFile = fs.existsSync(npmrcPath)
  ? fs.readFileSync(npmrcPath, 'utf8')
  : ''

npmrcFile.split('\n')
  .forEach((line) => {
    const list = line.split('=')
    npmrc[list[0]] = list[1] || true
  })

// for safer
delete npmrc.AuthSession

module.exports = Object.assign(defaultrc, npmrc)
