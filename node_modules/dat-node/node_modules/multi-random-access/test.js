var test = require('tape')
var Storage = require('./')
var ram = require('random-access-memory')

test('Storage(open)', function (t) {
  t.plan(5)

  var i = 0
  var storage = Storage(function (offset, cb) {
    if (i++ === 0) {
      t.equal(offset, 0)
      cb(new Error('nooo'))
    } else {
      t.equal(offset, 10)
      var index = Math.floor(offset / 10)
      cb(null, {
        start: index * 10,
        end: index * 10 + 10,
        storage: ram(new Buffer('yuss'))
      })
    }
  })
  storage.read(0, 10, function (err, buf) {
    t.ok(err)
    storage.read(10, 4, function (err, buf) {
      t.error(err)
      t.deepEqual(buf, new Buffer('yuss'))
    })
  })
})

test('big write', function (t) {
  var storage = Storage()

  storage.add({
    start: 0,
    end: 10,
    storage: ram()
  })

  storage.add({
    start: 10,
    end: 20,
    storage: ram()
  })

  storage.add({
    start: 20,
    end: 30,
    storage: ram()
  })

  var buf = new Buffer(25)

  storage.write(0, buf, function (err) {
    t.error(err)
    storage.read(0, 25, function (err, val) {
      t.error(err)
      t.same(val, buf)
      t.end()
    })
  })
})

test('read + write', function (t) {
  t.plan(3)

  var storage = Storage(function (offset, cb) {
    var index = Math.floor(offset / 10)
    cb(null, {
      start: index * 10,
      end: index * 10 + 10,
      storage: ram(new Buffer(10))
    })
  })
  storage.write(0, new Buffer('hello world'), function (err) {
    t.error(err)
    storage.read(0, 11, function (err, buf) {
      t.error(err)
      t.deepEqual(buf, new Buffer('hello world'))
    })
  })
})

test('del', function (t) {
  var storage = Storage(function (offset, cb) {
    var index = Math.floor(offset / 10)
    var buf = new Buffer(10)
    buf.fill(0)
    cb(null, {
      start: index * 10,
      end: index * 10 + 10,
      storage: ram(buf)
    })
  })

  storage.write(0, new Buffer('hello world'), function (err) {
    t.error(err)
    storage.del(0, 10, function (err) {
      t.error(err)
      storage.read(0, 11, function (err, buf) {
        t.error(err)
        var target = new Buffer(11)
        target.fill(0)
        target[target.length - 1] = 'd'.charCodeAt(0)
        t.same(buf, target)
        t.end()
      })
    })
  })
})

test('more than limit', function (t) {
  var storage = Storage({limit: 1}, function (offset, cb) {
    var index = Math.floor(offset / 10)
    cb(null, {
      start: index * 10,
      end: index * 10 + 10,
      storage: ram(new Buffer(10))
    })
  })

  storage.write(0, new Buffer('hello world'), function (err) {
    t.error(err)
    t.same(storage.stores.length, 1)
    t.end()
  })
})

test('binary search', function (t) {
  var storage = Storage()
  var target = ram(new Buffer(28))

  storage.add({
    start: 42,
    end: 46,
    storage: ram(new Buffer(4))
  })

  storage.add({
    start: 14,
    end: 42,
    storage: target
  })

  storage.add({
    start: 0,
    end: 14,
    storage: ram(new Buffer(14))
  })

  storage.write(15, new Buffer('hi'), function () {
    target.read(1, 2, function (err, buf) {
      t.error(err)
      t.same(buf, new Buffer('hi'))
      t.end()
    })
  })
})

test('end', function (t) {
  t.plan(3)

  var storage = Storage()

  storage.add({
    start: 0,
    end: 9,
    storage: create()
  })

  storage.add({
    start: 10,
    end: 19,
    storage: create()
  })

  storage.end(function (err) {
    t.error(err)
  })

  function create () {
    var childStorage = ram(new Buffer(10))

    childStorage.end = function (opts, cb) {
      t.ok(true)
      cb()
    }

    return childStorage
  }
})
