var http = require('http')
var url = require('url')
var test = require('tape')
var request = require('request')
var hyperdriveHttp = require('..')

var server = http.createServer()

test('setup', function (t) {
  server.listen(8001)
  server.once('listening', function () {
    t.end()
  })
})

test('GET Parsing no key', function (t) {
  t.plan(8)
  var count = 0
  var rootUrl = 'http://localhost:8001'
  var fileTests = [ // parsed filename should match these
    undefined,
    'file.txt',
    'dir/file.txt',
    'dir/subdir/file.txt'
  ]

  var onrequest = hyperdriveHttp(function (info, cb) {
    t.same(info.key, null, 'key is null')
    t.same(info.filename, fileTests[count], 'file parse ok')
    count++
    if (count === fileTests.length) server.removeListener('request', onrequest)
    cb(404)
  })
  server.on('request', onrequest)
  fileTests.forEach(function (filePath) {
    var getUrl = filePath ? url.resolve(rootUrl, filePath) : rootUrl
    request.get(getUrl).on('error', function () {

    })
  })
})

test('GET Parsing with key', function (t) {
  t.plan(8)
  var count = 0
  var rootUrl = 'http://localhost:8001'
  var fileTests = [ // parsed filename should match these
    '72072fab3d3f593453c1caed2b4b176b03af2f58ef725722c8937403997c03f8',
    '72072fab3d3f593453c1caed2b4b176b03af2f58ef725722c8937403997c03f8/file.txt',
    '72072fab3d3f593453c1caed2b4b176b03af2f58ef725722c8937403997c03f8/dir/file.txt',
    '72072fab3d3f593453c1caed2b4b176b03af2f58ef725722c8937403997c03f8/dir/subdir/file.txt'
  ]

  var onrequest = hyperdriveHttp(function (info, cb) {
    var segs = fileTests[count].split('/')
    t.same(info.key, segs.shift())
    t.same(info.filename, segs.join('/'), 'file parse ok')
    if (count === fileTests.length) server.removeListener('request', onrequest)
    cb(404)
  })
  server.on('request', onrequest)
  next()

  function next () {
    testFile(fileTests[count], function () {
      if (count === fileTests.length) return
      next()
    })
  }

  function testFile (filePath, cb) {
    var getUrl = filePath ? url.resolve(rootUrl, filePath) : rootUrl
    request.get(getUrl)
    .on('response', function () {
      count++
      cb()
    })
  }
})

test.onFinish(function () {
  server.close()
})
