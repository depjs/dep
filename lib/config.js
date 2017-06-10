function config (argv) {
  argv._handled = true
  const sub = argv._.slice(1)
}

config.store = {
  registry: 'https://registry.yarnpkg.com/'
}

config.get = function (key) {
  return this.store[key]
}

config.set = function (key, value) {
  this.store[key] = value
}

config.list = function () {
  return this.store
}

module.exports = {
  command: 'config',
  describe: '',
  handler: config,
  aliases: []
}
