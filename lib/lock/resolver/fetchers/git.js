import semver from '../../../utils/semver.js'
import { fetchJSON } from '../../../utils/fetch.js'
import git from '../../../utils/git.js'

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

export default async (name, spec, result) => {
  const hosted = result.hosted
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
  const body = await fetchJSON(filetemplate(hosted))
  return {
    type: 'git',
    version: body.version,
    dependencies: body.dependencies,
    url: httpstemplate(hosted, true)
  }
}
