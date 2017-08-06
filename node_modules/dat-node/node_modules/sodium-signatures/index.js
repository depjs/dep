try {
  module.exports = require('./sodium')
} catch (err) {
  module.exports = require('./browser')
}
