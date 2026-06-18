import path from 'path'
import fs from 'fs'

const version = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url))
).version
const defaultrc = {
  userAgent: `dep/${version} node/${process.version}`,
  registry: 'https://registry.yarnpkg.com/',
  'save-prefix': '^'
}

const npmrc = {}
const npmrcPath = path.join(process.env.HOME, '.npmrc')
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

export default Object.assign(defaultrc, npmrc)
