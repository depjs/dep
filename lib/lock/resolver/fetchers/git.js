const request = require('request')
const npmrc = require('../../../utils/npmrc')
const git = require('../../../utils/git')
const semver = require('semver')

const filetemplate = (hosted) => {
  return hosted.filetemplate
    .replace('{auth@}', hosted.auth ? hosted.auth + '@' : '')
    .replace('{domain}', hosted.domain)
    .replace('{user}', hosted.user)
    .replace('{project}', hosted.project)
    .replace('{committish}', hosted.committish ? hosted.committish : '')
    .replace('{path}', 'package.json')
}

const httpstemplate = (hosted, committish) => {
  return hosted.httpstemplate
    .replace('git+https', 'https')
    .replace('{auth@}', hosted.auth ? hosted.auth + '@' : '')
    .replace('{domain}', hosted.domain)
    .replace('{user}', hosted.user)
    .replace('{project}', hosted.project)
    .replace('{#committish}', committish ? '#' + hosted.committish : '')
}

module.exports = (name, spec, result) => {
  var hosted = result.hosted
  return new Promise((resolve, reject) => {
    if (!hosted.committish) {
      hosted.committish = git.sync(['ls-remote', httpstemplate(hosted), 'HEAD'])
        .slice(0, 6)
    } else if (hosted.committish.startsWith('semver:')) {
      const range = hosted.committish.replace('semver:', '')
      const list = git.sync(['ls-remote', '--tags', httpstemplate(hosted)])
        .split('\n')
      list.forEach((str) => {
        if (str.split('\t').length === 1) return
        const hash = str.split('\t')[0].slice(0, 6)
        const version = str.split('\t')[1].replace('refs/tags/', '')
        if (version.match(/\^\{\}/)) return
        if (!semver.valid(version)) return
        if (semver.satisfies(version, range)) hosted.committish = hash
      })
    } else {
      const committish = git.sync(['ls-remote', '--tags', httpstemplate(hosted)])
        .split('\n')
        .filter((str, i) => {
          return str.indexOf(hosted.committish) !== -1
        }).pop()
      hosted.committish = committish
        ? committish.split('\t')[0]
        : hosted.committish
    }
    const options = {
      url: filetemplate(hosted),
      headers: {
        'User-Agent': npmrc.userAgent
      }
    }
    var body = ''
    request.get(options)
      .on('data', (chunk) => { body += chunk })
      .on('end', () => {
        try {
          body = JSON.parse(body)
          resolve({
            type: 'git',
            version: body.version,
            dependencies: body.dependencies,
            url: httpstemplate(hosted, true)
          })
        } catch (e) { return reject(e) }
      })
      .on('error', reject)
  })
}
