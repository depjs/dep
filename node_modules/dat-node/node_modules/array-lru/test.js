var tape = require('tape')
var alru = require('./')

tape('set and get', function (t) {
  var lru = alru(8)
  lru.set(42, 'hello')
  lru.set(59244, 'world')
  t.same(lru.get(43), null)
  t.same(lru.get(42), 'hello')
  t.same(lru.get(59244), 'world')
  t.end()
})

tape('overflow', function (t) {
  var evicted = []
  var lru = alru(8, {
    evict: function (index, value) {
      t.same(value, 'hello-' + index)
      evicted.push(index)
    }
  })

  for (var i = 0; i < 16; i++) {
    lru.set(i, 'hello-' + i)
  }

  for (var j = 0; j < 16; j++) {
    var e = evicted.indexOf(j) > -1
    if (e) t.same(lru.get(j), null, 'should be evicted')
    else t.same(lru.get(j), 'hello-' + j, 'not evicted')
  }

  t.end()
})

tape('lru', function (t) {
  var lru = alru(8)

  for (var i = 0; i < 16; i++) {
    lru.get(0)
    lru.get(1)
    lru.get(2)
    lru.set(i, 'hello-' + i)
  }

  t.same(lru.get(0), 'hello-0')
  t.same(lru.get(1), 'hello-1')
  t.same(lru.get(2), 'hello-2')

  t.end()
})
