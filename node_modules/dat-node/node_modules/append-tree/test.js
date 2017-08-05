var tape = require('tape')
var hypercore = require('hypercore')
var ram = require('random-access-memory')
var tree = require('./')

tape('basic', function (t) {
  var tr = create()

  tr.get('/hello', function (err) {
    t.ok(err, 'had error')
    tr.put('/hello', 'world', function (err) {
      t.error(err, 'no error')
      tr.get('/hello', function (err, value) {
        t.error(err, 'no error')
        t.same(value, new Buffer('world'))
        tr.get('/foo', function (err) {
          t.ok(err, 'had error')
          t.end()
        })
      })
    })
  })
})

tape('basic list', function (t) {
  t.plan(5)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.list('/', function (err, list) {
      t.error(err, 'no error')
      t.same(list, ['hello'])
    })
    tr.list('/hello', function (err, list) {
      t.error(err, 'no error')
      t.same(list, [])
    })
    tr.list('/hello/world', function (err, list) {
      t.ok(err, 'had error')
    })
  })
})

tape('put twice', function (t) {
  t.plan(4)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.put('/world', 'hello', function () {
      tr.get('/hello', function (err, value) {
        t.error(err, 'no error')
        t.same(value, new Buffer('world'))
      })
      tr.get('/world', function (err, value) {
        t.error(err, 'no error')
        t.same(value, new Buffer('hello'))
      })
    })
  })
})

tape('put twice same folder', function (t) {
  t.plan(8)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.put('/hello/world', 'hello', function () {
      tr.get('/hello', function (err, value) {
        t.error(err, 'no error')
        t.same(value, new Buffer('world'))
      })
      tr.get('/hello/world', function (err, value) {
        t.error(err, 'no error')
        t.same(value, new Buffer('hello'))
      })
      tr.list('/', function (err, list) {
        t.error(err, 'no error')
        t.same(list, ['hello'])
      })
      tr.list('/hello', function (err, list) {
        t.error(err, 'no error')
        t.same(list, ['world'])
      })
    })
  })
})

tape('put twice same folder diff root', function (t) {
  t.plan(8)

  var tr = create()

  tr.put('/root', 'root', function () {
    tr.put('/hello', 'world', function () {
      tr.put('/hello/world', 'hello', function () {
        tr.get('/hello', function (err, value) {
          t.error(err, 'no error')
          t.same(value, new Buffer('world'))
        })

        tr.get('/hello/world', function (err, value) {
          t.error(err, 'no error')
          t.same(value, new Buffer('hello'))
        })

        tr.list('/', function (err, list) {
          t.error(err, 'no error')
          t.same(list, ['root', 'hello'])
        })

        tr.list('/hello', function (err, list) {
          t.error(err, 'no error')
          t.same(list, ['world'])
        })
      })
    })
  })
})

tape('put three times', function (t) {
  t.plan(6)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.put('/world', 'hello', function () {
      tr.put('/hello/world', 'hi', function () {
        tr.get('/hello', function (err, value) {
          t.error(err, 'no error')
          t.same(value, new Buffer('world'))
        })
        tr.get('/world', function (err, value) {
          t.error(err, 'no error')
          t.same(value, new Buffer('hello'))
        })
        tr.get('/hello/world', function (err, value) {
          t.error(err, 'no error')
          t.same(value, new Buffer('hi'))
        })
      })
    })
  })
})

tape('put four times', function (t) {
  t.plan(19)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.put('/world', 'hello', function () {
      tr.put('/hello/world', 'hi', function () {
        tr.put('/world/hello', 'hi', function () {
          tr.get('/hello', function (err, value) {
            t.error(err, 'no error')
            t.same(value, new Buffer('world'))
          })
          tr.get('/world', function (err, value) {
            t.error(err, 'no error')
            t.same(value, new Buffer('hello'))
          })
          tr.get('/hello/world', function (err, value) {
            t.error(err, 'no error')
            t.same(value, new Buffer('hi'))
          })
          tr.get('/world/hello', function (err, value) {
            t.error(err, 'no error')
            t.same(value, new Buffer('hi'))
          })
          tr.list('/', function (err, list) {
            t.error(err, 'no error')
            t.same(list, ['hello', 'world'])
          })
          tr.list('/hello', function (err, list) {
            t.error(err, 'no error')
            t.same(list, ['world'])
          })
          tr.list('/world', function (err, list) {
            t.error(err, 'no error')
            t.same(list, ['hello'])
          })
          tr.list('/world/foo', function (err) {
            t.ok(err, 'had error')
          })
          tr.list('/world/hello', function (err, list) {
            t.error(err, 'no error')
            t.same(list, [])
          })
          tr.list('/hello/world', function (err, list) {
            t.error(err, 'no error')
            t.same(list, [])
          })
        })
      })
    })
  })
})

tape('put and delete', function (t) {
  t.plan(2)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.del('/hello', function () {
      tr.list('/hello', function (err) {
        t.ok(err, 'had error')
      })
      tr.get('/hello', function (err, node) {
        t.ok(err, 'had error')
      })
    })
  })
})

tape('twice put and delete', function (t) {
  t.plan(4)

  var tr = create()

  tr.put('/world', 'hello', function () {
    tr.put('/hello', 'world', function () {
      tr.del('/hello', function () {
        tr.list('/', function (err, list) {
          t.error(err, 'no error')
          t.same(list, ['world'])
        })
        tr.get('/hello', function (err) {
          t.ok(err, 'had error')
        })
        tr.get('/world', function (err) {
          t.error(err, 'no error')
        })
      })
    })
  })
})

tape('twice put (opposite order) and delete', function (t) {
  t.plan(4)

  var tr = create()

  tr.put('/hello', 'world', function () {
    tr.put('/world', 'hello', function () {
      tr.del('/hello', function () {
        tr.list('/', function (err, list) {
          t.error(err, 'no error')
          t.same(list, ['world'])
        })
        tr.get('/hello', function (err) {
          t.ok(err, 'had error')
        })
        tr.get('/world', function (err) {
          t.error(err, 'no error')
        })
      })
    })
  })
})

tape('many puts and delete', function (t) {
  t.plan(8)

  var tr = create()

  tr.put('/hello', 'a')
  tr.put('/hello', 'b')
  tr.put('/hello', 'c')
  tr.put('/world/foo', 'bar')
  tr.put('/world', 'baz')
  tr.put('/world', 'hello', function () {
    tr.del('/hello')
    tr.put('/hello', 'world', function () {
      tr.del('/world', function () {
        tr.list('/', function (err, list) {
          t.error(err, 'no error')
          t.same(list.sort(), ['hello', 'world'])
        })
        tr.get('/hello', function (err, val) {
          t.error(err, 'no error')
          t.same(val, new Buffer('world'))
        })
        tr.get('/world/foo', function (err, val) {
          t.error(err, 'no error')
          t.same(val, new Buffer('bar'))
        })
        tr.list('/world', function (err, list) {
          t.error(err, 'no error')
          t.same(list, ['foo'])
        })
      })
    })
  })
})

tape('many puts and delete 2', function (t) {
  t.plan(7)

  var tr = create()

  tr.put('/a/b/c/d/e', '0')
  tr.put('/a', '1')
  tr.put('/a/a', '2')
  tr.put('/a/b/c/d/f', '3')
  tr.del('/a/b/c/d/f', function () {
    tr.get('/a', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('1'))
    })
    tr.get('/a/a', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('2'))
    })
    tr.get('/a/b/c/d/e', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('0'))
    })
    tr.get('/a/b/c/d/f', function (err) {
      t.ok(err, 'had error')
    })
  })
})

tape('many puts and delete 2 (opposite)', function (t) {
  t.plan(7)

  var tr = create()

  tr.put('/a/b/c/d/e', '0')
  tr.put('/a', '1')
  tr.put('/a/a', '2')
  tr.put('/a/b/c/d/f', '3')
  tr.del('/a/b/c/d/e', function () {
    tr.get('/a', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('1'))
    })
    tr.get('/a/a', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('2'))
    })
    tr.get('/a/b/c/d/f', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('3'))
    })
    tr.get('/a/b/c/d/e', function (err) {
      t.ok(err, 'had error')
    })
  })
})

tape('valueEncoding', function (t) {
  var tr = create({valueEncoding: 'json'})

  tr.put('/', {hello: 'world'}, function () {
    tr.get('/', function (err, val) {
      t.error(err, 'no error')
      t.same(val, {hello: 'world'})
      t.end()
    })
  })
})

tape('checkout', function (t) {
  t.plan(6)

  var tr = create()

  tr.put('/', 'foo')
  tr.put('/foo', 'bar')
  tr.del('/foo')
  tr.put('/bar', 'baz')
  tr.put('/bar', 'meh', function () {
    var old1 = tr.checkout(0)

    old1.list('/', function (err, list) {
      t.error(err, 'no error')
      t.same(list, [])
    })

    var old2 = tr.checkout(3)

    old2.list('/', function (err, list) {
      t.error(err, 'no error')
      t.same(list, ['bar'])
    })

    old2.get('/bar', function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('baz'))
    })
  })
})

tape('history stream', function (t) {
  var tr = create()

  tr.put('/', 'foo')
  tr.put('/foo', 'bar')
  tr.del('/foo')
  tr.put('/bar', 'baz', function () {
    var expected = [{
      type: 'put',
      version: 0,
      name: '/',
      value: new Buffer('foo')
    }, {
      type: 'put',
      version: 1,
      name: '/foo',
      value: new Buffer('bar')
    }, {
      type: 'del',
      version: 2,
      name: '/foo',
      value: null
    }, {
      type: 'put',
      version: 3,
      name: '/bar',
      value: new Buffer('baz')
    }]

    tr.history()
      .on('data', function (data) {
        t.same(data, expected.shift())
      })
      .on('end', function () {
        t.same(expected.length, 0)
        t.end()
      })
  })
})

tape('cached', function (t) {
  t.plan(5)

  var tr = create({cache: false})

  tr.put('/', 'foo')
  tr.put('/foo', 'bar')
  tr.put('/bar', 'baz', function () {
    tr.feed.clear(1, function () {
      tr.list('/', {cached: true}, function (err, list) {
        t.error(err, 'no error')
        t.same(list, ['bar'])
      })
      tr.get('/bar', {cached: true}, function (err, val) {
        t.error(err, 'no error')
        t.same(val, new Buffer('baz'))
      })
      tr.get('/foo', {cached: true}, function (err) {
        t.ok(err, 'had error')
      })
    })
  })
})

tape('default options', function (t) {
  t.plan(6)

  var tr = create({node: true})

  tr.put('/', 'foo')
  tr.put('/foo', 'bar')
  tr.put('/bar', 'baz', function () {
    tr.list('/', function (err, list) {
      t.error(err, 'no error')
      t.same(list, [{
        type: 'put',
        name: '/foo',
        version: 1,
        value: new Buffer('bar')
      }, {
        type: 'put',
        name: '/bar',
        version: 2,
        value: new Buffer('baz')
      }])
    })
    tr.get('/bar', function (err, val) {
      t.error(err, 'no error')
      t.same(val, {
        type: 'put',
        name: '/bar',
        version: 2,
        value: new Buffer('baz')
      })
    })
    tr.get('/bar', {node: false}, function (err, val) {
      t.error(err, 'no error')
      t.same(val, new Buffer('baz'))
    })
  })
})

tape('diff', function (t) {
  var tr = create()

  tr.put('/foo', 'bar')
  tr.put('/bar', 'baz', function () {
    var stream = tr.checkout(0).diff(tr)
    var expected = [{type: 'put', name: '/bar', value: new Buffer('baz'), version: 1}]

    stream.on('data', function (data) {
      t.same(data, expected.shift())
    })
    stream.on('end', function () {
      t.same(expected.length, 0, 'no more data')
      t.end()
    })
  })
})

tape('diff empty', function (t) {
  var tr = create()

  tr.put('/foo', 'bar')
  tr.put('/bar', 'baz', function () {
    var stream = tr.checkout(-1).diff(tr)
    var expected = [{
      type: 'put',
      name: '/foo',
      value: new Buffer('bar'),
      version: 0
    }, {
      type: 'put',
      name: '/bar',
      value: new Buffer('baz'),
      version: 1
    }]

    stream.on('data', function (data) {
      t.same(data, expected.shift())
    })
    stream.on('end', function () {
      t.same(expected.length, 0, 'no more data')
      t.end()
    })
  })
})

tape('diff self', function (t) {
  var tr = create()

  tr.put('/foo', 'bar')
  tr.put('/bar', 'baz', function () {
    var stream = tr.diff(tr)

    stream.on('data', function (data) {
      t.fail('no diff')
    })
    stream.on('end', function () {
      t.pass('diff ends')
      t.end()
    })
  })
})

tape('diff with dels', function (t) {
  var tr = create()

  tr.put('/foo', 'bar')
  tr.put('/bar', 'foo')
  tr.del('/foo', function () {
    var stream = tr.checkout(0).diff(tr)
    var expected = [{
      type: 'del',
      name: '/foo',
      value: new Buffer('bar'),
      version: 0
    }, {
      type: 'put',
      name: '/bar',
      value: new Buffer('foo'),
      version: 1
    }]

    stream.on('data', function (data) {
      t.same(data, expected.shift())
    })

    stream.on('end', function () {
      t.same(expected.length, 0, 'no more data')
      t.end()
    })
  })
})

tape('diff with overwrites', function (t) {
  var tr = create()

  tr.put('/foo', 'bar')
  tr.put('/bar', 'foo')
  tr.put('/foo', 'baz', function () {
    var stream = tr.checkout(0).diff(tr)
    var expected = [{
      type: 'del',
      name: '/foo',
      value: new Buffer('bar'),
      version: 0
    }, {
      type: 'put',
      name: '/bar',
      value: new Buffer('foo'),
      version: 1
    }, {
      type: 'put',
      name: '/foo',
      value: new Buffer('baz'),
      version: 2
    }]

    stream.on('data', function (data) {
      t.same(data, expected.shift())
    })

    stream.on('end', function () {
      t.same(expected.length, 0, 'no more data')
      t.end()
    })
  })
})

tape('diff only dels', function (t) {
  var tr = create()

  tr.put('/foo', 'bar')
  tr.put('/bar', 'foo')
  tr.put('/foo', 'baz', function () {
    var stream = tr.checkout(0).diff(tr, {puts: false, dels: true})
    var expected = [{
      type: 'del',
      name: '/foo',
      value: new Buffer('bar'),
      version: 0
    }]

    stream.on('data', function (data) {
      t.same(data, expected.shift())
    })

    stream.on('end', function () {
      t.same(expected.length, 0, 'no more data')
      t.end()
    })
  })
})

tape('last del + diff', function (t) {
  var tr = create()

  tr.put('/b', 'a')
  tr.put('/c', 'a')
  tr.del('/a')
  tr.put('/foo/a', 'a')
  tr.del('/b')
  tr.put('/foo/b', 'a')
  tr.del('/c')
  tr.put('/foo/c', 'a')
  tr.del('/foo/a')
  tr.put('/foo/bar/a', 'a')
  tr.del('/foo/b')
  tr.put('/foo/bar/b', 'a')
  tr.del('/foo/c')
  tr.put('/foo/bar/c', 'a')
  tr.del('/foo/bar/a')
  tr.put('/foo/bar/baz/a', 'a')
  tr.del('/foo/bar/b')
  tr.put('/foo/bar/baz/b', 'a') // 17
  tr.del('/foo/bar/c')
  tr.del('/foo/bar/baz/a') // 19
  tr.put('/foo/bar/baz/c', 'a', function () {
    var a = tr.checkout(17)
    var b = tr.checkout(19)

    var expected = [{
      type: 'del',
      name: '/foo/bar/c',
      value: new Buffer('a'),
      version: 13
    }, {
      type: 'del',
      name: '/foo/bar/baz/a',
      value: new Buffer('a'),
      version: 15
    }]

    a.diff(b)
      .on('data', function (data) {
        t.same(expected.shift(), data)
      })
      .on('end', function () {
        t.end()
      })
  })
})

tape('@pfrazee bug delete removes too much', function (t) {
  var tr = create()

  tr.put('/dat.json', 'put')
  tr.put('/2016', 'put')
  tr.put('/404.html', 'put')
  tr.put('/Gemfile', 'put')
  tr.put('/Gemfile.lock', 'put')
  tr.put('/assets', 'put')
  tr.put('/blog', 'put')
  tr.put('/feed.xml', 'put')
  tr.put('/index.html', 'put')
  tr.put('/2016/08', 'put')
  tr.put('/assets/css', 'put')
  tr.put('/assets/fonts', 'put')
  tr.put('/assets/img', 'put')
  tr.put('/assets/js', 'put')
  tr.put('/assets/vid', 'put')
  tr.put('/blog/a-chat-about-beaker-apps.html', 'put')
  tr.put('/blog/achieving-scale.html', 'put')
  tr.put('/blog/actually-serverless.html', 'put')
  tr.put('/blog/alan-kays-talks.html', 'put')
  tr.put('/blog/announcing-dathttpd.html', 'put')
  tr.put('/blog/beaker-browser-0.1.html', 'put')
  tr.put('/blog/beaker-browser-0.2.html', 'put')
  tr.put('/blog/computing-trust.html', 'put')
  tr.put('/blog/index.html', 'put')
  tr.put('/blog/not-media-companies.html', 'put')
  tr.put('/blog/web-of-trust-roundup.html', 'put')
  tr.put('/blog/webcomponents-yo.html', 'put')
  tr.put('/blog/what-is-the-p2p-web.html', 'put')
  tr.put('/blog/why-johnny-cant-encrypt.html', 'put')
  tr.put('/2016/08/10', 'put')
  tr.put('/assets/css/main.css', 'put')
  tr.put('/assets/fonts/inconsolata-400-latin-ext.woff2', 'put')
  tr.put('/assets/fonts/inconsolata-400-latin.woff2', 'put')
  tr.put('/assets/fonts/inconsolata-700-latin-ext.woff2', 'put')
  tr.put('/assets/fonts/inconsolata-700-latin.woff2', 'put')
  tr.put('/assets/img/alankay.jpg', 'put')
  tr.put('/assets/img/app-as-media-conversation.png', 'put')
  tr.put('/assets/img/auto-updater.gif', 'put')
  tr.put('/assets/img/beaker-thumb.png', 'put')
  tr.put('/assets/img/beaker.jpg', 'put')
  tr.put('/assets/img/beaker.png', 'put')
  tr.put('/assets/img/cat1.jpg', 'put')
  tr.put('/assets/img/computing-trust.jpg', 'put')
  tr.put('/assets/img/conquistador.jpg', 'put')
  tr.put('/assets/img/ct_hash_1.png', 'put')
  tr.put('/assets/img/ct_hash_2.png', 'put')
  tr.put('/assets/img/dat-viewer-history.png', 'put')
  tr.put('/assets/img/dat-viewer.png', 'put')
  tr.put('/assets/img/datdns.png', 'put')
  tr.put('/assets/img/favicon.png', 'put')
  tr.put('/assets/img/getting-started-screen-justcreated.png', 'put')
  tr.put('/assets/img/github.svg', 'put')
  tr.put('/assets/img/home.jpg', 'put')
  tr.put('/assets/img/illustration-fork.png', 'put')
  tr.put('/assets/img/illustration-hosting-service-hybrid.png', 'put')
  tr.put('/assets/img/illustration-hosting.png', 'put')
  tr.put('/assets/img/lol-contributions.png', 'put')
  tr.put('/assets/img/markedowneditor.png', 'put')
  tr.put('/assets/img/p2p-site-info.png', 'put')
  tr.put('/assets/img/pgp1.png', 'put')
  tr.put('/assets/img/pgp2.png', 'put')
  tr.put('/assets/img/pgp3.png', 'put')
  tr.put('/assets/img/pgp4.png', 'put')
  tr.put('/assets/img/pics', 'put')
  tr.put('/assets/img/prank.png', 'put')
  tr.put('/assets/img/request-create-dat.png', 'put')
  tr.put('/assets/img/request-network-access.png', 'put')
  tr.put('/assets/img/todolist.png', 'put')
  tr.put('/assets/img/twitter.png', 'put')
  tr.put('/assets/img/web.jpg', 'put')
  tr.put('/assets/img/webcomponents.png', 'put')
  tr.put('/assets/img/whyjohnnycantencrypt.jpg', 'put')
  tr.put('/assets/js/fun.js', 'put')
  tr.put('/assets/js/main.js', 'put')
  tr.put('/assets/js/vars.js', 'put')
  tr.put('/assets/vid/beaker-0.1-demo.mp4', 'put')
  tr.put('/2016/08/10/beaker-browser-0.1.html', 'put')
  tr.put('/assets/img/pics/decentralized-web-summit-2016-1.jpg', 'put')
  tr.put('/assets/img/pics/hash-the-planet-2014.jpg', 'put')
  tr.put('/assets/img/pics/wizard-eating-a-cupcake-2013.jpg', 'put')
  tr.put('/feed.xml', 'put')
  tr.del('/dat.json')
  tr.put('/404.html', 'put')
  tr.put('/feed.xml', 'put')
  tr.put('/index.html', 'put')
  tr.put('/blog/a-chat-about-beaker-apps.html', 'put')
  tr.put('/blog/achieving-scale.html', 'put')
  tr.put('/blog/actually-serverless.html', 'put')
  tr.put('/blog/alan-kays-talks.html', 'put')
  tr.put('/blog/announcing-dathttpd.html', 'put')
  tr.put('/blog/beaker-browser-0.1.html', 'put')
  tr.put('/blog/beaker-browser-0.2.html', 'put')
  tr.put('/blog/computing-trust.html', 'put')
  tr.put('/blog/index.html', 'put')
  tr.put('/blog/not-media-companies.html', 'put')
  tr.put('/blog/web-of-trust-roundup.html', 'put')
  tr.put('/blog/webcomponents-yo.html', 'put')
  tr.put('/blog/what-is-the-p2p-web.html', 'put')
  tr.put('/blog/why-johnny-cant-encrypt.html', 'put')
  tr.del('/assets/img/pics/wizard-eating-a-cupcake-2013.jpg')
  tr.del('/assets/img/pics/decentralized-web-summit-2016-1.jpg')
  tr.del('/assets/img/pics/hash-the-planet-2014.jpg')
  tr.del('/assets/img/pics')
  tr.put('/assets/css/main.css', 'put')
  tr.put('/assets/img/beaker-editor-1.png', 'put')
  tr.put('/assets/img/beaker-editor-2.png', 'put')
  tr.put('/assets/img/beaker-editor-3.png', 'put')
  tr.put('/assets/img/feed.png', 'put')
  tr.put('/assets/img/robot.jpeg', 'put')
  tr.put('/2016/08/10/beaker-browser-0.1.html', 'put')
  tr.put('/assets/img/alankay.jpg', 'put')
  tr.put('/assets/img/app-as-media-conversation.png', 'put')
  tr.put('/assets/img/auto-updater.gif', 'put')
  tr.put('/assets/img/beaker-thumb.png', 'put')
  tr.put('/assets/img/beaker.jpg', 'put')
  tr.put('/assets/img/beaker.png', 'put')
  tr.put('/assets/img/cat1.jpg', 'put')
  tr.put('/assets/img/computing-trust.jpg', 'put')
  tr.put('/assets/img/conquistador.jpg', 'put')
  tr.put('/assets/img/ct_hash_1.png', 'put')
  tr.put('/assets/img/ct_hash_2.png', 'put')
  tr.put('/assets/img/dat-viewer-history.png', 'put')
  tr.put('/assets/img/dat-viewer.png', 'put')
  tr.put('/assets/img/datdns.png', 'put')
  tr.put('/assets/img/favicon.png', 'put')
  tr.put('/assets/img/getting-started-screen-justcreated.png', 'put')
  tr.put('/assets/img/github.svg', 'put')
  tr.put('/assets/img/home.jpg', 'put')
  tr.put('/assets/img/illustration-fork.png', 'put')
  tr.put('/assets/img/illustration-hosting-service-hybrid.png', 'put')
  tr.put('/assets/img/illustration-hosting.png', 'put')
  tr.put('/assets/img/lol-contributions.png', 'put')
  tr.put('/assets/img/markedowneditor.png', 'put')
  tr.put('/assets/img/p2p-site-info.png', 'put')
  tr.put('/assets/img/pgp1.png', 'put')
  tr.put('/assets/img/pgp2.png', 'put')
  tr.put('/assets/img/pgp3.png', 'put')
  tr.put('/assets/img/pgp4.png', 'put')
  tr.put('/assets/img/prank.png', 'put')
  tr.put('/assets/img/request-create-dat.png', 'put')
  tr.put('/assets/img/request-network-access.png', 'put')
  tr.put('/assets/img/todolist.png', 'put')
  tr.put('/assets/img/twitter.png', 'put')
  tr.put('/assets/img/web.jpg', 'put')
  tr.put('/assets/img/webcomponents.png', 'put')
  tr.put('/assets/img/whyjohnnycantencrypt.jpg', 'put')
  tr.put('/dat.json', 'put')
  tr.put('/404.html', 'put')
  tr.put('/feed.xml', 'put')
  tr.put('/index.html', 'put')
  tr.put('/blog/a-chat-about-beaker-apps.html', 'put')
  tr.put('/blog/achieving-scale.html', 'put')
  tr.put('/blog/actually-serverless.html', 'put')
  tr.put('/blog/alan-kays-talks.html', 'put')
  tr.put('/blog/announcing-dathttpd.html', 'put')
  tr.put('/blog/beaker-browser-0.1.html', 'put')
  tr.put('/blog/beaker-browser-0.2.html', 'put')
  tr.put('/blog/computing-trust.html', 'put')
  tr.put('/blog/index.html', 'put')
  tr.put('/blog/not-media-companies.html', 'put')
  tr.put('/blog/web-of-trust-roundup.html', 'put')
  tr.put('/blog/webcomponents-yo.html', 'put')
  tr.put('/blog/what-is-the-p2p-web.html', 'put')
  tr.put('/blog/why-johnny-cant-encrypt.html', 'put')
  tr.put('/assets/css/main.css', 'put')
  tr.put('/2016/08/10/beaker-browser-0.1.html', 'put')
  tr.del('/assets/img/robot.jpeg')
  tr.put('/404.html', 'put', function () {
    tr.list('/assets/', function (err, list) {
      t.error(err, 'no error')
      t.same(list.sort(), ['css', 'fonts', 'img', 'js', 'vid'])
      tr.get('/assets/img/robot.jpeg', function (err, node) {
        t.ok(err, 'should error')
        t.end()
      })
    })
  })
})

function create (opts) {
  return tree(hypercore(ram), opts)
}
