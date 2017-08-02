const path = require('path')
const list = require('./run/list')
const runner = require('./run/runner')

const run = (argv) => {
  argv._handled = true
  const pkgJSON = require(path.join(process.cwd(), 'package.json'))
  if (!pkgJSON.scripts) return
  if (argv._.length === 1) {
    list(pkgJSON)
  } else {
    runner(argv._, pkgJSON)
  }
}

module.exports = {
  command: 'run',
  describe: 'Run an arbitrary command from scripts in package.json',
  handler: run,
  aliases: ['r']
}
