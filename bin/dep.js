#!/usr/bin/env node

const semver = require('semver')
const yargs = require('yargs')
const updateNotifier = require('update-notifier').default
const commands = {
  install: require('../lib/install'),
  lock: require('../lib/lock'),
  run: require('../lib/run')
}
const pkgJSON = require('../package.json')
const notifier = updateNotifier({ pkg: pkgJSON })

const allowLegacyNode = ['1', 'true', 'yes'].includes((process.env.DEP_ALLOW_OLD_NODE || '').toLowerCase())

if (!allowLegacyNode && !semver.satisfies(process.version, pkgJSON.engine.node)) {
  process.stderr.write(`dep requires Node.js ${pkgJSON.engine.node} (detected ${process.version})\n`)
  process.stderr.write('Upgrade Node.js to continue.\n')
  process.exit(1)
}

if (notifier.update) {
  notifier.notify()
}

yargs.usage(pkgJSON.description)

yargs.help('help')
  .alias('help', 'h')

yargs.version()
  .alias('version', 'v')
  .describe('version', 'Show version information')

Object.keys(commands).forEach((i) => {
  yargs.command(commands[i])
})

const argv = yargs.argv

if (!argv._handled) yargs.showHelp()
