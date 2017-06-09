#!/usr/bin/env node

if (Number(process.version.substr(1, 1)) < 8) {
  console.error('N-API is available in Node.js 8.0')
  process.exit(1)
}

const yargs = require('yargs')
const requireDirectory = require('require-directory')
const commands = requireDirectory(module, '../lib')

yargs.usage('Usage is here')

yargs.help('help')
  .alias('help', 'h')

yargs.version(function () { return require('../package').version })
  .alias('version', 'v')
  .describe('version', 'Show version information')

Object.keys(commands).forEach(function (c) {
  var cmd = commands[c]
  yargs.command(cmd)
  if (cmd.aliases) {
    cmd.aliases.forEach(function (alias) {
      yargs.command(alias, false, cmd)
    })
  }
})

const argv = yargs.argv

if (!argv._handled) yargs.showHelp()
