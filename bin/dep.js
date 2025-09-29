#!/usr/bin/env node

const semver = require('semver')
const yargs = require('yargs')
const commands = {
  install: require('../lib/install'),
  lock: require('../lib/lock'),
  run: require('../lib/run')
}
const pkgJSON = require('../package.json')

const allowLegacyNode = ['1', 'true', 'yes'].includes((process.env.DEP_ALLOW_OLD_NODE || '').toLowerCase())

if (!allowLegacyNode && !semver.satisfies(process.version, pkgJSON.engine.node)) {
  process.stderr.write(`dep requires Node.js ${pkgJSON.engine.node} (detected ${process.version})\n`)
  process.stderr.write('Upgrade Node.js to continue.\n')
  process.exit(1)
}

const loadUpdateNotifier = async () => {
  try {
    const mod = await import('update-notifier')
    return mod.default ?? mod
  } catch (error) {
    if (!process.env.DEP_SILENCE_UPDATE_NOTIFIER_ERRORS && (process.env.DEBUG || process.env.NODE_ENV === 'test')) {
      // Surface failures when debugging to ease troubleshooting
      console.error('Failed to load update-notifier:', error.message)
    }
    return null
  }
}

const run = async () => {
  const updateNotifier = await loadUpdateNotifier()
  const notifier = updateNotifier ? updateNotifier({ pkg: pkgJSON }) : null

  if (notifier?.update) {
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
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
