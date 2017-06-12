const { join } = require('path')
const { readFileSync } = require('fs')
const { version } = require(join(__dirname, '../../package.json'))
const defaultrc = {
  'userAgent': `dep/${version} node/${process.version}`,
  registry: 'https://registry.yarnpkg.com/'
}

let npmrc = {}
const npmrcPath = join(process.env.HOME, '.npmrc')
const npmrcFile = readFileSync(npmrcPath, 'utf8')

npmrcFile.split('\n')
  .forEach((line) => {
    const list = line.split('=')
    npmrc[list[0]] = list[1] || true
  })

// for safer
delete npmrc['AuthSession']

module.exports = Object.assign(defaultrc, npmrc)
