const spawn = require('cross-spawn')
const npmPath = require('npm-path')
const each = require('promise-each')

module.exports = (_, pkg) => {
  const args = _.slice(1)
  const scripts = pkg.scripts
  const key = args.shift()
  var cmds = Object.keys(scripts).filter((script) => {
    return script === 'pre' + key ||
      script === key ||
      script === 'post' + key
  }).map((script) => {
    return scripts[script]
  })
  var env = process.env
  var newPath = npmPath.getSync({})
  env[npmPath.PATH] = newPath

  return Promise.resolve(cmds).then(each((cmd) => {
    return new Promise((resolve, reject) => {
      const script = spawn(cmd, args, {shell: true, env: env})
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
