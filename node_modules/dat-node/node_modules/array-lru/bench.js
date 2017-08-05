var bench = require('nanobench')
var alru = require('./')
var hlru = require('hashlru')

bench('insert 750.000 values (hashlru)', function (b) {
  var lru = hlru(65536)

  for (var i = 0; i < 750000; i++) {
    lru.set('' + i, i)
  }

  b.end()
})

bench('insert+get 750.000 values (hashlru)', function (b) {
  var lru = hlru(65536)

  for (var i = 0; i < 750000; i++) {
    var k = '' + i
    lru.set(k, i)
    lru.get(k)
  }

  b.end()
})

bench('insert 750.000 values (array-lru)', function (b) {
  var lru = alru(65536)

  for (var i = 0; i < 750000; i++) {
    lru.set(i, i)
  }

  b.end()
})

bench('insert+get 750.000 values (array-lru)', function (b) {
  var lru = alru(65536)

  for (var i = 0; i < 750000; i++) {
    lru.set(i, i)
    lru.get(i)
  }

  b.end()
})

bench('insert 750.000 values (array-lru, 8 collisions)', function (b) {
  var lru = alru(65536, {collisions: 8})

  for (var i = 0; i < 750000; i++) {
    lru.set(i, i)
  }

  b.end()
})

bench('insert+get 750.000 values (array-lru, 8 collisions)', function (b) {
  var lru = alru(65536, {collisions: 8})

  for (var i = 0; i < 750000; i++) {
    lru.set(i, i)
    lru.get(i)
  }

  b.end()
})
