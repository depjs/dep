var tape = require('tape')
var random = require('./')

tape('open before read', function (t) {
  t.plan(3)

  var storage = random({
    open: function (cb) {
      t.pass('opened')
      cb()
    },
    read: function (offset, length, cb) {
      t.pass('reading')
      cb(null, Buffer(length))
    }
  })

  storage.read(0, 10, function (err) {
    t.error(err)
    t.end()
  })
})

tape('open before write', function (t) {
  t.plan(3)

  var storage = random({
    open: function (cb) {
      t.pass('opened')
      cb()
    },
    write: function (offset, buf, cb) {
      t.pass('writing')
      cb()
    }
  })

  storage.write(0, Buffer(10), function (err) {
    t.error(err)
    t.end()
  })
})

tape('open only fires once', function (t) {
  t.plan(7)

  var opened = 0
  var storage = random({
    open: function (cb) {
      opened++
      setTimeout(function () {
        cb()
      }, 100)
    },
    read: function (offset, length, cb) {
      cb(null, Buffer(length))
    }
  })

  storage.open(function (err) {
    t.error(err)
  })

  storage.read(0, 10, function (err, buf) {
    t.same(opened, 1)
    t.error(err)
    t.ok(buf)
  })

  storage.read(10, 5, function (err, buf) {
    t.same(opened, 1)
    t.error(err)
    t.ok(buf)
  })
})

tape('close', function (t) {
  t.plan(2)

  var storage = random({
    open: function (cb) {
      t.pass('opened')
      cb(null)
    },
    close: function (cb) {
      t.pass('closed')
      cb(null)
    }
  })

  storage.close(function () {
    t.end()
  })
})

tape('end', function (t) {
  var storage = random()
  storage.end({}, function (err) {
    t.error(err)
    storage.end(function (err) {
      t.error(err)
      t.end()
    })
  })
})
