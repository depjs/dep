#!/usr/bin/env node

const semver = require('semver')
const yargs = require('yargs')
const requireDirectory = require('require-directory')
const updateNotifier = require('update-notifier')
const commands = requireDirectory(module, '../lib/', {exclude: /utils/})
const pkgJSON = require('../package.json')
const notifier = updateNotifier({pkg: pkgJSON})

if (!semver.satisfies(process.version, pkgJSON.engine.node)) {
  process.stderr.write('dep works only on Node.js LTS versions\n')
  process.stderr.write('See the schedule: https://github.com/nodejs/LTS#lts-schedule1\n')
  process.exit(1)
}

if (notifier.update) {
  notifier.notify()
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
