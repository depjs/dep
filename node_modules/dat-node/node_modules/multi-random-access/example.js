var multi = require('./')
var ram = require('random-access-memory')

var list = []
var n = 0

for (var i = 0; i < 1024; i++) {
  n += (Math.random() * 5000) | 0
  list.push(n)
}

// var list = [
//   4012,
//   8520,
//   12604
// ]

// var n = 12604

var storage = multi(function (offset, cb) {
  console.log('opening', offset)
  for (var i = 0; i < list.length; i++) {
    if (list[i] > offset) {
      cb(null, {
        start: list[i - 1] || 0,
        end: list[i],
        storage: ram()
      })
      return
    }
  }
})

storage.write(0, Buffer('hello world 1'))
storage.write(4000, Buffer('hello world 2'))
// storage.write(8000, Buffer('hello world 4'))
storage.write(10000, Buffer('hello world 34'), function () {
  storage.read(10000, 11, console.log)
})

storage.write(50000, Buffer('hi'))
