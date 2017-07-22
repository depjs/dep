const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const tree = require('strong-npm-ls')
const test = require('ava')
const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures'))

test.cb(t => {
  let count = fixtures.length
	t.plan(count)
  fixtures.forEach(fixture => {
    const bin = path.join(__dirname, '..', 'bin', 'dep.js')
    const pkg = path.join(__dirname, 'fixtures', fixture)
    exec(`node ${bin} install`, {cwd: pkg}, (err, stdout, stderr) => {
      count -= 1
      tree.read(pkg, (e, d) => {
        t.ifError(e)
        if (count === 0) t.end()
      })
    })
  })
})
