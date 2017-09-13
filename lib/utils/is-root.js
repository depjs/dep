module.exports = () => {
  return process.getuid && process.getuid() === 0
}
