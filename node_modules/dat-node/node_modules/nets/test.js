var test = require('tape')
var nets = require('./')
var bin
var binUrl = 'http://requestb.in'

var headers = {
  'x-requested-with': 'nets',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

test('GET a new requestbin for this test run', function (t) {
  nets({url: binUrl + '/api/v1/bins', method: 'POST', json: true, headers: headers}, function (err, resp, newBin) {
    t.notOk(err, 'no err')
    t.ok(newBin.name, 'bin has a name')
    bin = newBin
    t.end()
  })
})

test('GET url property', function (t) {
  nets({url: binUrl + '/' + bin.name, headers: headers}, function (err, resp, body) {
    t.ok(Buffer.isBuffer(body), 'response data is a Buffer by default')
    t.notOk(err, 'no err')
    t.equal(resp.statusCode, 200, '200 OK')
    getRequests(function (err, resp, reqs) {
      t.notOk(err, 'no err')
      t.equal(reqs.length, 1)
      var req = reqs[0]
      t.equal(req.path, '/' + bin.name, 'path matches')
      t.end()
    })
  })
})

test('GET uri property', function (t) {
  nets({uri: binUrl + '/' + bin.name, headers: headers}, function (err, resp, body) {
    t.notOk(err, 'no err')
    t.equal(resp.statusCode, 200, '200 OK')
    getRequests(function (err, resp, reqs) {
      t.notOk(err, 'no err')
      t.equal(reqs.length, 2)
      var req = reqs[0]
      t.equal(req.path, '/' + bin.name, 'path matches')
      t.end()
    })
  })
})

test('GET w/ custom header', function (t) {
  headers['X-Hello'] = 'hello!'
  nets({url: binUrl + '/' + bin.name, headers: headers}, function (err, resp, body) {
    delete headers['X-Hello']
    t.notOk(err, 'no err')
    t.equal(resp.statusCode, 200, '200 OK')
    getRequests(function (err, resp, reqs) {
      t.notOk(err, 'no err')
      t.equal(reqs.length, 3)
      var req = reqs[0]
      t.equal(req.path, '/' + bin.name, 'path matches')
      t.equal(req.headers['X-Hello'], 'hello!', 'header matches')
      t.end()
    })
  })
})

test('POST', function (t) {
  nets({url: binUrl + '/' + bin.name, headers: headers, method: 'POST', body: 'hello'}, function (err, resp, body) {
    t.notOk(err, 'no err')
    t.equal(resp.statusCode, 200, '200 OK')
    getRequests(function (err, resp, reqs) {
      t.notOk(err, 'no err')
      t.equal(reqs.length, 4)
      var req = reqs[0]
      t.equal(req.path, '/' + bin.name, 'path matches')
      t.equal(req.body, 'hello', 'body matches')
      t.equal(req.method, 'POST', 'POST')
      t.end()
    })
  })
})

test('PUT', function (t) {
  nets({url: binUrl + '/' + bin.name, headers: headers, method: 'PUT', body: 'hello put'}, function (err, resp, body) {
    t.notOk(err, 'no err')
    t.equal(resp.statusCode, 200, '200 OK')
    getRequests(function (err, resp, reqs) {
      t.notOk(err, 'no err')
      t.equal(reqs.length, 5)
      var req = reqs[0]
      t.equal(req.path, '/' + bin.name, 'path matches')
      t.equal(req.body, 'hello put', 'body matches')
      t.equal(req.method, 'PUT', 'PUT')
      t.end()
    })
  })
})

test('DELETE', function (t) {
  nets({url: binUrl + '/' + bin.name, headers: headers, method: 'DELETE'}, function (err, resp, body) {
    t.notOk(err, 'no err')
    t.equal(resp.statusCode, 200, '200 OK')
    getRequests(function (err, resp, reqs) {
      t.notOk(err, 'no err')
      t.equal(reqs.length, 6)
      var req = reqs[0]
      t.equal(req.path, '/' + bin.name, 'path matches')
      t.equal(req.method, 'DELETE')
      t.end()
    })
  })
})

test('returns value', function (t) {
  t.ok(nets({url: 'http://localhost'}, function () {}), 'nets has return value')
  t.end()
})

function getRequests (cb) {
  nets({
    url: binUrl + '/api/v1/bins/' + bin.name + '/requests',
    json: true,
    headers: headers
  }, function (err, resp, body) {
      cb(err, resp, body)
    })
}

// {
//   "method": 'GET',
//   "path": "/zsdmvmzs",
//   "form_data": {},
//   "body": "",
//   "time": 1400675602.691776,
//   "content_length": 0,
//   "remote_addr": "192.168.101.13, 172.16.231.24, 138.62.0.21",
//   "headers": {
//     "Via": "1.1 73-46:3128 (squid/2.7.STABLE6), 1.0 cache_server:3128 (squid/2.6.STABLE21)",
//     "X-Request-Id": "23c1e383-23a8-497d-b9e9-c7c17935e162",
//     "X-Bluecoat-Via": "a640f636fca622c2",
//     "Host": "requestb.in",
//     "Cache-Control": "max-age=259200",
//     "Connection": "close"
//   },
//   "id": "1bqzf2",
//   "content_type": "",
//   "query_string": {}
// }
