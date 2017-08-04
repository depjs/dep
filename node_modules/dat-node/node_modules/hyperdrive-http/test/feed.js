var http = require('http')
var test = require('tape')
var memdb = require('memdb')
var hypercore = require('hypercore')
var request = require('request')
var hyperdriveHttp = require('..')

var core = hypercore(memdb())
var feed1 = core.createFeed()
var feed2 = core.createFeed()
var server = http.createServer()
var feeds = {}
feeds[feed1.key.toString('hex')] = feed1
feeds[feed2.key.toString('hex')] = feed2

test('setup', function (t) {
  server.listen(8080)
  server.once('listening', function () {
    feed1.append('hello', function () {
      feed1.append('world', function () {
        t.end()
      })
    })
    var quote = {
      quote: 'Today you are you! That is truer than true! There is no one alive who is you-er than you!',
      source: 'Dr. Seuss'
    }
    feed2.append(JSON.stringify(quote))
  })
})

test('Single Feed Data', function (t) {
  var onrequest = hyperdriveHttp(feed1)
  server.once('request', onrequest)
  request('http://localhost:8080', function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.ok(body, 'received data')
      body = body.trim().split('\n')
      t.same(body[0], '"hello"', 'first chunk correct')
      t.same(body[1], '"world"', 'second chunk correct')
      t.end()
    } else {
      t.fail('bad response')
      t.end()
    }
  })
})

test('Multiple Feed Data', function (t) {
  var onrequest = hyperdriveHttp(getFeed)
  server.once('request', onrequest)
  request('http://localhost:8080/' + feed1.key.toString('hex'), function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.ok(body, 'received data')
      body = body.trim().split('\n')
      t.same(body[0], '"hello"', 'first chunk correct')
      t.same(body[1], '"world"', 'second chunk correct')
      t.end()
    }
  })
})

test.onFinish(function () {
  server.close()
})

function getFeed (info, cb) {
  cb(null, feeds[info.key])
}
