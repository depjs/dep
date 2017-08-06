var test = require('tape')
var enc = require('dat-encoding')
var datResolve = require('..')

// Strings that do not require lookup
var stringKeys = [
  {type: 'valid', key: '6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'valid', key: Buffer.from('6161616161616161616161616161616161616161616161616161616161616161', 'hex')},
  {type: 'valid', key: 'dat://6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'valid', key: 'datproject.org/6161616161616161616161616161616161616161616161616161616161616161'},
  {type: 'valid', key: 'dat://6161616161616161616161616161616161616161616161616161616161616161/'},
  {type: 'valid', key: 'datproject.org/6161616161616161616161616161616161616161616161616161616161616161/'},
  {type: 'valid', key: 'host.com/whatever/6161616161616161616161616161616161616161616161616161616161616161'}
]

test('resolve key without http', function (t) {
  t.plan(3 * 7) // 3 tests for 7 keys
  stringKeys.forEach(function (key) {
    datResolve(key.key, function (err, newKey) {
      t.error(err, 'no error')
      t.equal(newKey, '6161616161616161616161616161616161616161616161616161616161616161', 'link correct')
      t.ok(enc.encode(newKey), 'valid key')
    })
  })
})

test('resolve beaker browser', function (t) {
  datResolve('beakerbrowser.com', function (err, key) {
    t.error(err, 'no error')
    t.ok(key, 'got key')
    t.end()
  })
})
