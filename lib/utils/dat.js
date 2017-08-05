const fs = require('fs')
const path = require('path')
const installed = fs.existsSync(
  path.join(__dirname, '../../node_modules/dat-node/node_modules')
)

module.exports = installed ? require('dat-node') : function () {}
