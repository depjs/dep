var fs = require('fs')
var read = require('./')

var rs = read(fs.openSync(__filename, 'r'), {retry: 100})

rs.on('data', console.log)
