var fs = require('fs')
var path = require('path')
var test = require('tape')
var tmp = require('temporary-directory')
var hyperdrive = require('hyperdrive')
var ram = require('random-access-memory')
var mirror = require('..')

var fixtures = path.join(__dirname, 'fixtures')

test('mirror regular fs', function (t) {
  tmp(function (err, dir, cleanup) {
    t.ifError(err, 'error')

    var puts = 0
    var pending = 0
    var progress = mirror(fixtures, dir, function (err) {
      t.ifError(err, 'error')
      done()
    })

    progress.on('pending', function () {
      pending++
    })

    progress.on('ignore', function () {
      pending--
    })

    progress.on('skip', function () {
      pending--
    })

    progress.on('put', function () {
      t.ok(progress.pending.length, 'pending items')
      pending--
    })

    progress.on('put-end', function (src) {
      puts++
    })

    function done () {
      t.ok(progress.pending.length === 0, 'no items in pending queue')
      t.same(pending, 0, 'zero items pending')
      t.same(puts, 2, 'two files added')
      t.ok(fs.statSync(path.join(dir, 'hello.txt')), 'file copied')
      t.ok(fs.statSync(path.join(dir, 'dir', 'file.txt')), 'file copied')

      cleanup(function (err) {
        t.ifError(err, 'error')
        t.end()
      })
    }
  })
})

test('mirror + destory in progress', function (t) {
  tmp(function (err, dir, cleanup) {
    t.ifError(err, 'error')

    var puts = 0
    var progress = mirror(fixtures, dir, function (err) {
      t.ifError(err, 'error')
      t.fail('should not callback')
    })

    progress.on('put', function (src) {
      puts++
      if (puts === 1) {
        process.nextTick(function () {
          progress.destroy()
          done()
        })
      }
    })

    function done () {
      t.same(fs.readdirSync(path.join(dir)).length, 1, 'only 1 thing mirrored')

      cleanup(function (err) {
        t.ifError(err, 'error')
        t.end()
      })
    }
  })
})

test('mirror regular fs with watch mode', function (t) {
  tmp(function (err, dir, cleanup) {
    t.ifError(err, 'error')

    var tmpFile = path.join(fixtures, 'tmp.txt')
    var puts = 0
    var progress = mirror(fixtures, dir, {
      watch: true
    })

    progress.on('put-end', function (src) {
      puts++
      if (puts === 2) {
        fs.writeFile(tmpFile, 'hello', 'utf-8')
      }
      if (src.name.indexOf('tmp.txt') > -1) done()
    })

    progress.on('error', function (err) {
      t.ifError(err, 'error')
    })

    function done () {
      t.same(puts, 3, '3 files added')
      t.ok(fs.statSync(path.join(dir, 'tmp.txt')), 'file copied')
      t.ok(fs.statSync(path.join(dir, 'hello.txt')), 'file copied')
      t.ok(fs.statSync(path.join(dir, 'dir', 'file.txt')), 'file copied')

      fs.unlinkSync(tmpFile)
      progress.destroy()
      cleanup(function (err) {
        t.ifError(err, 'error')
        t.end()
      })
    }
  })
})

test('mirror regular fs to custom fs', function (t) {
  var archive = hyperdrive(ram)
  archive.ready(function (err) {
    t.ifError(err, 'error')

    var puts = 0
    var progress = mirror(fixtures, {fs: archive, name: '/'}, function (err) {
      t.ifError(err, 'error')
      done()
    })

    progress.on('put-end', function (src) {
      puts++
    })

    function done () {
      t.same(puts, 2, 'two files added')
      archive.stat('/hello.txt', function (err, stat) {
        t.ifError(err, 'error')
        t.ok(stat)
        t.end()
      })
    }
  })
})

test('dry run regular fs', function (t) {
  tmp(function (err, dir, cleanup) {
    t.ifError(err, 'error')

    var puts = 0
    var putEnds = 0
    var progress = mirror(fixtures, dir, {dryRun: true}, function (err) {
      t.ifError(err, 'error')
      done()
    })

    progress.on('put', function (src) {
      puts++
    })

    progress.on('put-end', function (src) {
      putEnds++
    })

    function done () {
      t.same(puts, 3, 'three puts')
      t.same(putEnds, 2, 'two putEnd')
      t.throws(function () { fs.statSync(path.join(dir, 'hello.txt')) }, 'file not copied')
      t.throws(function () { fs.statSync(path.join(dir, 'dir', 'file.txt')) }, 'file not copied')

      cleanup(function (err) {
        t.ifError(err, 'error')
        t.end()
      })
    }
  })
})

test('delete extra files in dest', function (t) {
  tmp(function (err, dir, cleanup) {
    t.ifError(err, 'error')
    fs.writeFileSync(path.join(dir, 'extra.txt'), 'extra stuff')

    mirror(fixtures, dir, function (err) {
      t.ifError(err, 'error')
      done()
    })

    function done () {
      t.ok(fs.statSync(path.join(dir, 'hello.txt')), 'file copied')
      t.ok(fs.statSync(path.join(dir, 'dir', 'file.txt')), 'file copied')
      t.throws(function () { fs.statSync(path.join(dir, 'extra.txt')) }, 'extra file deleted')

      cleanup(function (err) {
        t.ifError(err, 'error')
        t.end()
      })
    }
  })
})
