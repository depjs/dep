const fs = require('fs')
const path = require('path')
const execPath = process.execPath
const binPath = path.dirname(execPath)
const pkg = path.join(execPath, '../../lib/node_modules/dep')
const bin = path.join(binPath, 'dep')

const rmdir = p => {
  if (fs.existsSync(p)) {
    fs.readdirSync(p).forEach((file, index) => {
      const current = path.join(p, file)
      if (fs.lstatSync(current).isDirectory()) {
        rmdir(current)
      } else {
        fs.unlinkSync(current)
      }
    })
    fs.rmdirSync(p)
  }
}

process.stdout.write('remove: ' + pkg + '\n')
rmdir(pkg)

process.stdout.write('remove: ' + bin + '\n')
fs.unlink(bin, e => {
  if (e) throw e
  process.stdout.write('dep was uninstalled successfully\n')
})
