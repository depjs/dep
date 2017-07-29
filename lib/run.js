const exec = require('child_process').exec
const fs = require('fs')
const npmPath = require('npm-path')
const path = require('path')
const spawn = require('child_process').spawn
const which = require('which')
const nm = require('./utils/nm')

const run = (argv) => {
  argv._handled = true
  const pkgJSON = require(path.join(process.cwd(), 'package.json'))
  const scripts = pkgJSON.scripts
  if (argv._.length === 1) {
    process.stdout.write(
      'Available scripts via `dep run`\n\n' +
      Object.keys(scripts).map((key) => {
        return 'dep run ' + key + ':\n  ' + scripts[key] + '\n'
      }).join('\n') + '\n'
    )
  } else {
    var env = {}
    var newPath = npmPath.getSync({})
    env[npmPath.PATH] = newPath
    const args = argv._.slice(1)
    var cmds = scripts[args.shift()] || ''
    cmds = cmds.split(' ')
    const cmd = cmds.shift()
    const script = spawn(cmd, args.concat(cmds), {env: env})
    script.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
  }
}

module.exports = {
  command: 'run',
  describe: 'Run package.json scripts',
  handler: run,
  aliases: ['r']
}
