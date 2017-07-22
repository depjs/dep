const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const tree = require('strong-npm-ls')
const test = require('ava')
const rimraf = require('rimraf')
const fixtures = fs.readdirSync(path.join(__dirname, 'fixtures'))

test.cb.before(t => {
  let count = fixtures.length
  t.plan(count)
  fixtures.forEach(fixture => {
    const modules = path.join(__dirname, 'fixtures', fixture, 'node_modules')
    rimraf(modules, _ => {
      count -= 1
      t.pass()
      if (count === 0) t.end()
    })
  })
})

test.cb(t => {
  let items = 3
  let count = fixtures.length * items
  t.plan(count)
  fixtures.forEach(fixture => {
    const bin = path.join(__dirname, '..', 'bin', 'dep.js')
    const pkg = path.join(__dirname, 'fixtures', fixture)
    const fix = fs.readFileSync(path.join(pkg, 'tree'), 'utf8')
    exec(`node ${bin} install`, {cwd: pkg}, (err, stdout, stderr) => {
      t.ifError(err)
      tree.read(pkg, (err, out) => {
        count -= items
        const deps = tree.printable(out, Number.MAX_VALUE)
        t.ifError(err)
        t.is(deps, fix)
        if (count === 0) t.end()
      })
    })
  })
})

test.cb.after(t => {
  let count = fixtures.length
  t.plan(count)
  fixtures.forEach(fixture => {
    const modules = path.join(__dirname, 'fixtures', fixture, 'node_modules')
    rimraf(modules, _ => {
      count -= 1
      t.pass()
      if (count === 0) t.end()
    })
  })
})
