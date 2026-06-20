#!/usr/bin/env node

import { readFileSync } from 'fs'
import { parseArgs } from 'util'
import semver from '../lib/utils/semver.js'
import updateNotifier from '../lib/utils/update-notifier.js'
import install from '../lib/install.js'
import lock from '../lib/lock.js'
import run from '../lib/run.js'

const pkgJSON = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url))
)

if (!semver.satisfies(process.version, pkgJSON.engines.node)) {
  process.stderr.write('dep works only on Node.js LTS versions\n')
  process.stderr.write('See the schedule: https://github.com/nodejs/LTS#lts-schedule1\n')
  process.exit(1)
}

updateNotifier({ name: pkgJSON.name, version: pkgJSON.version })

// Map every command name and alias to its module.
const modules = [install, lock, run]
const commands = {}
for (const mod of modules) {
  commands[mod.command] = mod
  for (const alias of mod.aliases || []) commands[alias] = mod
}

const help = () => {
  const rows = modules.map((mod) => {
    const names = [mod.command, ...(mod.aliases || [])].join(', ')
    return `  ${names.padEnd(14)}${mod.describe}`
  })
  return [
    pkgJSON.description,
    '',
    'Usage: dep <command> [options]',
    '',
    'Commands:',
    ...rows,
    '',
    'Options:',
    '  --save                  Save to dependencies (--save=dev for devDependencies)',
    '  --save-dev              Save to devDependencies',
    '  --only=prod|dev         Install only prod or dev dependencies',
    '  -w, --workspace <name>  Add the package(s) to the named workspace(s)',
    '  -h, --help              Show help',
    '  -v, --version           Show version information',
    ''
  ].join('\n')
}

// strict:false keeps unknown flags from throwing (e.g. flags meant for a
// `run` script); defined options still resolve with their declared types.
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  strict: false,
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    only: { type: 'string' },
    save: { type: 'string' },
    'save-dev': { type: 'boolean' },
    workspace: { type: 'string', short: 'w', multiple: true }
  }
})

// Normalise the save target: --save/--save=prod -> dependencies,
// --save=dev/--save-dev -> devDependencies, otherwise don't save.
const save = values['save-dev'] || values.save === 'dev'
  ? 'dev'
  : (values.save ? 'prod' : null)

const command = commands[positionals[0]]

if (values.version) {
  process.stdout.write(pkgJSON.version + '\n')
} else if (values.help) {
  process.stdout.write(help() + '\n')
} else if (command) {
  command.handler({ _: positionals, only: values.only, save, workspace: values.workspace })
} else {
  process.stderr.write(help() + '\n')
}
