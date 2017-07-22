const registry = require('./registry')

module.exports = (dep, deps) => {
  return registry(dep, deps)
}
