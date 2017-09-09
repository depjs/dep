var fs = require('fs')
var path = require('path')
var messages = fs.readFileSync(path.join(__dirname, 'messages.txt'), 'utf8').split('\n')

module.exports = function (name) {
  var num = Math.floor(Math.random() * (messages.length - 1))
  var message = messages[num]
  message = message.replace('$1', name)
  return message
}
