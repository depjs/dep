import path from 'path'
import fs from 'fs'
import resolver from './lock/resolver.js'
import locker from './lock/locker.js'

global.dependenciesTree = {}

const lock = (argv) => {
  argv._handled = true
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
  const deps = Object.assign(
    {},
    pkgJSON.optionalDependencies || {},
    pkgJSON.devDependencies || {},
    pkgJSON.dependencies || {}
  )

  const list = resolver(deps)
  process.stdout.write('Resolving dependencies\n')
  Promise.all(list).then(() => {
    locker(pkgJSON, global.dependenciesTree)
    process.stdout.write(
      'created package-lock.json\n'
    )
  }).catch((e) => { process.stderr.write(e.stack) })
}

export default {
  command: 'lock',
  describe: 'Lock dependencies installed in node_modules',
  handler: lock,
  aliases: ['l']
}
