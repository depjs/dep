var constants = require('cons' + 'tants') // be browserify friendly

var PADDING_NAME = '                                                   '
var PADDING_DATE = '                    '
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

module.exports = toHTML

function trim (src) {
  return src.trim().split('\n').map(map).join('\n')

  function map (line) {
    return line.trim()
  }
}

function isDirectory (mode) {
  if (typeof mode !== 'number' || typeof constants.S_IFDIR !== 'number') return false
  return (mode & constants.S_IFMT) === constants.S_IFDIR
}

function pad (s) {
  return s < 10 ? ('0' + s) : ('' + s)
}

function toHTML (opts, list) {
  if (typeof opts === 'string') opts = {directory: opts}

  var dir = opts.directory
  var footer = opts.footer
  var script = opts.script

  if (dir[dir.length - 1] === '/') dir = dir.slice(0, -1)

  var prev = `<a href="../">../</a>\n`
  var pre = prev + list.map(map).join('')
  var dirname = dir || '/'

  return trim(`
    <html>
    <head><title>Index of ${dirname}</title></head>
    <body bgcolor="white"><h1>Index of ${dirname}</h1><hr><pre>${pre}</pre><hr>${footer ? '<i>' + footer + '</i>' : ''}
    ${script ? '<script>' + script + '</script>' : ''}
    </body>
    </html>
  `)

  function map (entry) {
    var name = entry.name
    var isDir = name[name - 1] === '/' || isDirectory(entry.mode) || entry.type === 'directory'
    var size = isDir ? '-' : (typeof entry.size === 'number' ? '' + entry.size : '-')
    var mtime = typeof entry.mtime === 'number' ? new Date(entry.mtime) : entry.mtime

    var time = '-'
    if (mtime) {
      var d = pad(mtime.getDate())
      var m = MONTHS[mtime.getMonth()]
      var y = mtime.getFullYear()
      var h = pad(mtime.getHours())
      var min = pad(mtime.getMinutes())
      time = `${d}-${m}-${y} ${h}:${min}`
    }

    if (isDir && name[name.length - 1] !== '/') name += '/'

    var fname = fmt(name)
    var p1 = PADDING_NAME.slice(fname.length)
    var p2 = PADDING_DATE.slice(0, -size.length)
    var href = entry.href || encodeURI(name)
    if (opts.query) href += '?' + opts.query

    return `<a href="${href}" title="${name}">${fname}</a>${p1 + time + p2 + size}\n`
  }
}

function fmt (name) {
  if (name.length > 50) return name.slice(0, 47) + '..>'
  return name
}
