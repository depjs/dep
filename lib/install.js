const { URL } = require('url')
const config = require('./config').handler

function install (argv) {
  argv._handled = true
  const registry = config.get('registry')
  const url = new URL(argv.package, registry)
}

module.exports = {
  command: 'install <package>',
  describe: '',
  handler: install,
  aliases: ['i']
}
