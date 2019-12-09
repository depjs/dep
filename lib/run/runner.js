const spawn = require('child_process').spawn
const npmPath = require('npm-path')
const each = require('promise-each')

module.exports = (_, pkg, cwd) => {
  cwd = cwd || process.cwd()
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
      const script = spawn(cmd, args, { cwd: cwd, shell: true, env: env })
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
  })).catch((e) => {
    throw new Error(e)
  })
}
