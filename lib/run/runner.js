const spawn = require('cross-spawn')
const npmPath = require('npm-path')
const each = require('promise-each')

module.exports = (_, pkg) => {
  const args = _.slice(1)
  const scripts = pkg.scripts
  const key = args.shift()
  var cmds = Object.keys(scripts).filter((script) => {
    return script === 'pre' + key
      || script === key
      || script === 'post' + key
    }).map((script) => {
      return scripts[script].split(' ')
    })
  var env = process.env
  var newPath = npmPath.getSync({})
  env[npmPath.PATH] = newPath

  Promise.resolve(cmds).then(each((item) => {
    return new Promise((resolve, reject) => {
      const cmd = item.shift()
      const script = spawn(cmd, args.concat(item), {env: env})
      script.stdout.on('data', (data) => {
        process.stdout.write(data)
      })
      script.stderr.on('data', (data) => {
        reject(data)
      })
      script.on('close', (data) => {
        resolve()
      })
    })
  }))
}
