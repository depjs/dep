class Command {
  constructor () {
    this._values = {}
  }

  version () {
    return this
  }

  usage (text) {
    this._usage = text
    return this
  }

  option (flag) {
    const match = flag.match(/--([a-z-][a-z-]*)/i)
    if (!match) return this
    const key = match[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      get: () => this._values[key],
      set: (val) => { this._values[key] = val }
    })
    return this
  }

  parse (argv) {
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]
      if (arg.startsWith('--you=')) {
        this.you = arg.split('=')[1]
      } else if (arg === '--you' || arg === '-u') {
        this.you = argv[i + 1]
        i++
      }
    }
    return this
  }

  help () {
    if (this._usage) {
      console.log(this._usage)
    }
    process.exit(0)
  }
}

module.exports = new Command()
module.exports.Command = Command
