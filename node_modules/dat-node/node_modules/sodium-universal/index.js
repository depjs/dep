try {
  if (process.env.SODIUM_NATIVE === 'disable') throw new Error('Use sodium-javascript')
  module.exports = require('sodium-native')
} catch (err) {
  module.exports = require('sodium-javascript')
}
