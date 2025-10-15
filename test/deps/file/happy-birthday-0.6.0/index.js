const fs = require('fs')
const path = require('path')
const messages = fs.readFileSync(path.join(__dirname, 'messages.txt'), 'utf8').split('\n')

module.exports = function (name) {
  const num = Math.floor(Math.random() * (messages.length - 1))
  let message = messages[num]
  message = message.replace('$1', name)
  return message
}
