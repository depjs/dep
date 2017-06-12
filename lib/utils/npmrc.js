const { resolve } = require('path')
const { readFileSync } = require('fs')
const defaultrc = {
  'userAgent': 'npm/5.0.3 node/v8.1.0 darwin x64',
  registry: 'https://registry.yarnpkg.com/'
}

let npmrc = {}
const npmrcPath = resolve(process.env.HOME, '.npmrc')
const npmrcFile = readFileSync(npmrcPath, 'utf8')

npmrcFile.split('\n')
  .forEach((line) => {
    const list = line.split('=')
    npmrc[list[0]] = list[1] || true
  })

// for safer
delete npmrc['AuthSession']

module.exports = Object.assign(defaultrc, npmrc)
