#!/usr/bin/env node

const semver = require('semver')
const yargs = require('yargs')
const requireDirectory = require('require-directory')
const commands = requireDirectory(module, '../lib/', {exclude: /utils/})
const pkgJSON = require('../package.json')

if (!semver.satisfies(process.version, pkgJSON.engine.node)) {
  console.error('dep works only on Node.js LTS versions')
  console.error('See the schedule: https://github.com/nodejs/LTS#lts-schedule1')
  process.exit(1)
}

yargs.usage(pkgJSON.description)

yargs.help('help')
  .alias('help', 'h')

yargs.version(() => { return pkgJSON.version })
  .alias('version', 'v')
  .describe('version', 'Show version information')

Object.keys(commands).forEach((i) => {
  yargs.command(commands[i])
})

const argv = yargs.argv

if (!argv._handled) yargs.showHelp()
