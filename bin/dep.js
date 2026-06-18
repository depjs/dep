#!/usr/bin/env node

import { readFileSync } from 'fs'
import semver from 'semver'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import updateNotifier from 'update-notifier'
import install from '../lib/install.js'
import lock from '../lib/lock.js'
import run from '../lib/run.js'

const commands = { install, lock, run }
const pkgJSON = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url))
)

if (!semver.satisfies(process.version, pkgJSON.engines.node)) {
  process.stderr.write('dep works only on Node.js LTS versions\n')
  process.stderr.write('See the schedule: https://github.com/nodejs/LTS#lts-schedule1\n')
  process.exit(1)
}

const notifier = updateNotifier({ pkg: pkgJSON })
if (notifier.update) {
  notifier.notify()
}

const parser = yargs(hideBin(process.argv))
  .scriptName('dep')
  .usage(pkgJSON.description)
  .help('help')
  .alias('help', 'h')
  .version(pkgJSON.version)
  .alias('version', 'v')
  .describe('version', 'Show version information')

Object.keys(commands).forEach((i) => {
  parser.command(commands[i])
})

const argv = await parser.argv

if (!argv._handled) parser.showHelp()
