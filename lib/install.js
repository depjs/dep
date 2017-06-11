const path = require('path')
const URL = require('url').URL
const https = require('https')
const semver = require('semver')
const npmrc = require('./utils/npmrc')
const pkgJSON = require(path.join(process.env.PWD, 'package.json'))
const { dependencies, devDependencies } = pkgJSON

function install (argv) {
  argv._handled = true
  let map = {}
  const deps = argv.dev ? devDependencies : dependencies
  const list = Object.keys(deps).map((dep) => {
    const url = new URL(dep, npmrc.registry)
    return new Promise((resolve, reject) => {
      https.get(url.href, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          map[dep] = body
          resolve()
        })
      }).on('error', reject)
    })
  })

  Promise.all(list).then(() => {
    //console.log(Object.keys(map))
  })
}

module.exports = {
  command: 'install [dev]',
  describe: '',
  handler: install,
  aliases: ['i']
}
