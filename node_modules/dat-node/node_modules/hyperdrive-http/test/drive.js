var http = require('http')
var fs = require('fs')
var path = require('path')
var test = require('tape')
var memdb = require('memdb')
var hyperdrive = require('hyperdrive')
var request = require('request')
var raf = require('random-access-file')
var ndjson = require('ndjson')
var hyperdriveHttp = require('..')
var collect = require('collect-stream')
var encoding = require('dat-encoding')

var drive = hyperdrive(memdb())
var archive1 = drive.createArchive({
  file: function (name) {
    return raf(path.join(__dirname, name))
  }
})
var archive2 = drive.createArchive({
  file: function (name) {
    return raf(path.join(__dirname, name))
  }
})
var archive3 = drive.createArchive()
var server = http.createServer()
var archives = {}
archives[archive1.key.toString('hex')] = archive1
archives[archive2.key.toString('hex')] = archive2
archives[archive3.key.toString('hex')] = archive3

test('setup', function (t) {
  server.listen(8000)
  server.once('listening', function () {
    archive1.append('feed.js', function () {
      archive1.append('drive.js', function () {
        t.end()
      })
    })
    archive2.append('drive.js')
  })
})

test('Single Archive Metadata', function (t) {
  var onrequest = hyperdriveHttp(archive1)
  server.once('request', onrequest)
  request('http://localhost:8000', function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      var data = body.trim().split('\n')
      t.same(data.length, 2, 'Two files in metadata')
      t.same(JSON.parse(data[0]).name, 'feed.js', 'File name correct')
      t.same(res.headers['content-type'], 'application/json', 'JSON content-type header')
      t.end()
    }
  })
})

test('Single Archive GET File', function (t) {
  var onrequest = hyperdriveHttp(archive1)
  server.once('request', onrequest)
  request('http://localhost:8000/drive.js', function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.ok(body, 'Responds with file')
      fs.stat(path.join(__dirname, 'drive.js'), function (_, stat) {
        t.same(stat.size, body.length, 'File size correct')
        t.same(res.headers['content-type'], 'application/javascript', 'JS content-type header')
        t.end()
      })
    }
  })
})

test('Single Archive POST File', function (t) {
  var onrequest = hyperdriveHttp(archive3)
  server.once('request', onrequest)
  fs.createReadStream(path.join(__dirname, 'drive.js'))
  .pipe(request.post('http://localhost:8000', function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.equal(body.toString(), encoding.encode(archive3.key), 'Responds with key')
      collect(archive3.createFileReadStream('file'), function (err, body) {
        t.error(err, 'no hyperdrive error')
        t.same(body, fs.readFileSync(path.join(__dirname, 'drive.js')))
        t.end()
      })
    }
  }))
})

test('Single Archive Metadata Changes', function (t) {
  t.plan(4)
  var count = 0
  var onrequest = hyperdriveHttp(archive1)
  server.once('request', onrequest)
  request('http://localhost:8000/.changes')
    .on('response', function (res) {
      if (!res.statusCode) t.notOk('request failed')
      var timeoutInt = setInterval(function () {
        if (count === 2) {
          clearInterval(timeoutInt)
          res.socket.end()
        }
      }, 100)
      t.pass('receives response')
      t.same(res.headers['content-type'], 'application/json', 'JSON content-type header')
    })
    .pipe(ndjson.parse())
    .on('data', function (obj) {
      count++
      t.ok(obj, 'received file data')
    })
    .on('end', function () {
      if (count < 2) t.fail('response should not end early')
    })
})

test('Multiple Archives Metadata', function (t) {
  var onrequest = hyperdriveHttp(getArchive)
  server.once('request', onrequest)
  var reqUrl = 'http://localhost:8000/' + archive2.key.toString('hex')
  request(reqUrl, function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      var data = body.trim().split('\n')
      t.same(data.length, 1, 'One file in metadata')
      t.same(JSON.parse(data[0]).name, 'drive.js', 'File name correct')
      t.same(res.headers['content-type'], 'application/json', 'JSON content-type header')
      t.end()
    }
  })
})

test('Multiple Archives GET File', function (t) {
  var onrequest = hyperdriveHttp(getArchive)
  server.once('request', onrequest)
  var reqUrl = 'http://localhost:8000/' + archive2.key.toString('hex') + '/drive.js'
  request(reqUrl, function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.ok(body, 'Responds with file')
      fs.stat(path.join(__dirname, 'drive.js'), function (_, stat) {
        t.same(stat.size, body.length, 'File size correct')
        t.same(res.headers['content-type'], 'application/javascript', 'JS content-type header')
        t.end()
      })
    }
  })
})

test('Multiple Archive POST File', function (t) {
  var onrequest = hyperdriveHttp(getArchive)
  server.once('request', onrequest)
  fs.createReadStream(path.join(__dirname, 'drive.js'))
  .pipe(request.post('http://localhost:8000/', function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.equal(body.toString(), encoding.encode(archive3.key), 'Responds with key')
      collect(archive3.createFileReadStream('file'), function (err, body) {
        t.error(err, 'no hyperdrive error')
        t.same(body, fs.readFileSync(path.join(__dirname, 'drive.js')))
        t.end()
      })
    }
  }))
})

test('Multiple Archive POST File 2', function (t) {
  var onrequest = hyperdriveHttp(getArchive)
  server.once('request', onrequest)
  var reqUrl = 'http://localhost:8000/' + archive3.key.toString('hex')
  fs.createReadStream(path.join(__dirname, 'drive.js'))
  .pipe(request.post(reqUrl, function (err, res, body) {
    t.error(err, 'no request error')
    if (!err && res.statusCode === 200) {
      t.equal(body.toString(), encoding.encode(archive3.key), 'Responds with key')
      collect(archive3.createFileReadStream('file'), function (err, body) {
        t.error(err, 'no hyperdrive error')
        t.same(body, fs.readFileSync(path.join(__dirname, 'drive.js')))
        t.end()
      })
    }
  }))
})

test('Multiple Archive Metadata Changes', function (t) {
  t.plan(4)
  var count = 0
  var onrequest = hyperdriveHttp(archive1)
  server.once('request', onrequest)
  request('http://localhost:8000/.changes')
    .on('response', function (res) {
      if (!res.statusCode) t.notOk('request failed')
      var timeoutInt = setInterval(function () {
        if (count === 2) {
          clearInterval(timeoutInt)
          res.socket.end()
        }
      }, 100)
      t.pass('receives response')
      t.same(res.headers['content-type'], 'application/json', 'JSON content-type header')
    })
    .pipe(ndjson.parse())
    .on('data', function (obj) {
      count++
      t.ok(obj, 'received file data')
    })
    .on('end', function () {
      if (count < 2) t.fail('response should not end early')
    })
})

test.onFinish(function () {
  server.close()
})

function getArchive (info, cb) {
  cb(null, archives[info.key] || archive3)
}
