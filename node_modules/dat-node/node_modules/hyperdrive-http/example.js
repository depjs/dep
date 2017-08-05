var http = require('http')
var fs = require('fs')
var hyperdrive = require('hyperdrive')
var ram = require('random-access-memory')
var serve = require('.')

var archive = hyperdrive(ram)

var server = http.createServer(serve(archive, {exposeHeaders: true, live: true}))

archive.writeFile('readme.md', fs.readFileSync('readme.md'))
archive.writeFile('package.json', fs.readFileSync('package.json'))
archive.writeFile('index.js', fs.readFileSync('index.js'))
archive.writeFile('foo/index.html', '<h1>INDEX PAGE YO</h1>')

server.listen(8000)

console.info('Now listening on http://localhost:8000')
console.info('Visit in your browser to see metadata')
