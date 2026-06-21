import fs from 'fs'
import path from 'path'
import tap from 'tap'

const fixtures = fs.readdirSync(path.join(import.meta.dirname, 'deps'))

tap.test((t) => {
  let count = fixtures.length
  fixtures.forEach(fixture => {
    const modules = path.join(import.meta.dirname, 'deps', fixture, 'node_modules')
    const lock = path.join(import.meta.dirname, 'deps', fixture, 'node_modules.json')
    const pkgLock = path.join(import.meta.dirname, 'deps', fixture, 'package-lock.json')
    fs.rmSync(modules, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    fs.rmSync(lock, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    fs.rmSync(pkgLock, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    count -= 1
    if (count === 0) t.end()
  })
})
