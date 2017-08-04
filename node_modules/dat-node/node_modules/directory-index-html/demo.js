var http = require('http')
var fs = require('fs')
var toHTML = require('./')

http.createServer(function (req, res) {
  var dir = req.url

  fs.readdir('.' + dir, function (err, files) {
    if (err) return res.end('Hello, and welcome to Node.js')

    var entries = []
    loop()

    function loop () {
      if (!files.length) return res.end(toHTML(dir, entries, 'Listing created with "node demo.js"'))

      var name = files.shift()
      fs.stat('.' + dir + '/' + name, onstat)

      function onstat (err, st) {
        if (err) return res.end(err.stack)

        entries.push({
          name: name,
          mode: st.mode,
          size: st.size,
          mtime: st.mtime
        })

        loop()
      }
    }
  })
}).listen(8080, function () {
  console.log('Visit http://localhost:8080')
})
