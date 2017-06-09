function install (argv) {
  argv._handled = true
  console.log('install')
}

module.exports = {
  command: 'install <package>',
  describe: '',
  handler: install,
  aliases: ['i']
}
