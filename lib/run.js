import path from 'path'
import fs from 'fs'
import list from './run/list.js'
import runner from './run/runner.js'

const run = (argv) => {
  argv._handled = true
  const pkgJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
  if (!pkgJSON.scripts) return
  if (argv._.length === 1) {
    list(pkgJSON)
  } else {
    runner(argv._, pkgJSON).catch((e) => {
      process.stderr.write(e.message + '\n')
      process.exitCode = 1
    })
  }
}

export default {
  command: 'run',
  describe: 'Run an arbitrary command from scripts in package.json',
  handler: run,
  aliases: ['r']
}
