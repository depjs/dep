var tape = require('tape')
var ram = require('./')

tape('write and read', function (t) {
  var file = ram()

  file.write(0, new Buffer('hello'), function (err) {
    t.error(err, 'no error')
    file.read(0, 5, function (err, buf) {
      t.error(err, 'no error')
      t.same(buf, new Buffer('hello'))
      t.end()
    })
  })
})

tape('read empty', function (t) {
  var file = ram()

  file.read(0, 0, function (err, buf) {
    t.error(err, 'no error')
    t.same(buf, new Buffer(0), 'empty buffer')
    t.end()
  })
})

tape('read range > file', function (t) {
  var file = ram()

  file.read(0, 5, function (err, buf) {
    t.ok(err, 'not satisfiable')
    t.end()
  })
})

tape('random access write and read', function (t) {
  var file = ram()

  file.write(10, new Buffer('hi'), function (err) {
    t.error(err, 'no error')
    file.write(0, new Buffer('hello'), function (err) {
      t.error(err, 'no error')
      file.read(10, 2, function (err, buf) {
        t.error(err, 'no error')
        t.same(buf, new Buffer('hi'))
        file.read(0, 5, function (err, buf) {
          t.error(err, 'no error')
          t.same(buf, new Buffer('hello'))
          file.read(5, 5, function (err, buf) {
            t.error(err, 'no error')
            t.same(buf, new Buffer([0, 0, 0, 0, 0]))
            t.end()
          })
        })
      })
    })
  })
})

tape('buffer constructor', function (t) {
  var file = ram(new Buffer('contents'))
  file.read(0, 7, function (err, buf) {
    t.error(err)
    t.deepEqual(buf, new Buffer('content'))
    t.end()
  })
})
