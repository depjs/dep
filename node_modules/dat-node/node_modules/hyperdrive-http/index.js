var toHTML = require('directory-index-html')
var pump = require('pump')
var mime = require('mime')
var range = require('range-parser')
var qs = require('querystring')
var corsify = require('corsify')
var pkg = require('./package')

module.exports = serve

function serve (archive, opts) {
  if (!opts) opts = {}

  return corsify(onrequest)

  function onrequest (req, res) {
    var name = decodeURI(req.url.split('?')[0])
    var query = qs.parse(req.url.split('?')[1] || '')

    var wait = (query.wait && Number(query.wait.toString())) || 0
    var have = archive.metadata ? archive.metadata.length : -1

    if (wait <= have) return ready()
    waitFor(archive, wait, ready)

    function ready () {
      var arch = /^\d+$/.test(query.version) ? archive.checkout(Number(query.version)) : archive
      if (name[name.length - 1] === '/') ondirectory(arch, name, req, res, opts)
      else onfile(arch, name, req, res)
    }
  }
}

function onfile (archive, name, req, res) {
  archive.stat(name, function (err, st) {
    if (err) return onerror(res, 404, err)

    if (st.isDirectory()) {
      res.statusCode = 302
      res.setHeader('Location', name + '/')
      return
    }

    var r = req.headers.range && range(st.size, req.headers.range)[0]
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Type', mime.lookup(name))

    if (r) {
      res.statusCode = 206
      res.setHeader('Content-Range', 'bytes ' + r.start + '-' + r.end + '/' + st.size)
      res.setHeader('Content-Length', r.end - r.start + 1)
    } else {
      res.setHeader('Content-Length', st.size)
    }

    if (req.method === 'HEAD') return res.end()
    pump(archive.createReadStream(name, r), res)
  })
}

function ondirectory (archive, name, req, res, opts) {
  archive.stat(name + 'index.html', function (err) {
    if (err) return ondirectoryindex(archive, name, req, res, opts)
    onfile(archive, name + 'index.html', req, res)
  })
}

function ondirectoryindex (archive, name, req, res, opts) {
  list(archive, name, function (err, entries) {
    if (err) entries = []

    var wait = archive.metadata ? archive.metadata.length + 1 : 0
    var script = `
      function liveUpdate () {
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "${name}?wait=${wait}", true)
        xhr.onload = function () {
          if (xhr.status !== 200) return onerror()
          document.open()
          document.write(xhr.responseText)
          document.close()
        }
        xhr.onerror = onerror
        xhr.send(null)

        function onerror () {
          setTimeout(liveUpdate, 1000)
        }
      }

      liveUpdate()
    `

    var footer = opts.footer ? opts.footer + ' Archive version: ' + archive.version : null
    var html = toHTML({directory: name, script: (!opts.live || archive._checkout) ? null : script, footer: footer}, entries)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(html))
    if (opts.exposeHeaders) {
      res.setHeader('Hyperdrive-Key', archive.key.toString('hex'))
      res.setHeader('Hyperdrive-Version', archive.version)
      res.setHeader('Hyperdrive-Http-Version', pkg.version)
    }
    res.end(html)
  })
}

function waitFor (archive, until, cb) { // this feels a bit hacky, TODO: make less complicated?
  archive.setMaxListeners(0)
  if (!archive.metadata) archive.once('ready', waitFor.bind(null, archive, until, cb))
  if (archive.metadata.length >= until) return cb()
  archive.metadata.setMaxListeners(0)
  archive.metadata.once('append', waitFor.bind(null, archive, until, cb))
}

function onerror (res, status, err) {
  res.statusCode = status
  res.end(err.stack)
}

function list (archive, name, cb) {
  archive.readdir(name, function (err, names) {
    if (err) return cb(err)

    var error = null
    var missing = names.length
    var entries = []

    if (!missing) return cb(null, [])
    for (var i = 0; i < names.length; i++) stat(name + names[i], names[i])

    function stat (name, base) {
      archive.stat(name, function (err, st) {
        if (err) error = err

        if (st) {
          entries.push({
            type: st.isDirectory() ? 'directory' : 'file',
            name: base,
            size: st.size,
            mtime: st.mtime
          })
        }

        if (--missing) return
        if (error) return cb(error)
        cb(null, entries.sort(sort))
      })
    }
  })
}

function sort (a, b) {
  return a.name.localeCompare(b.name)
}
