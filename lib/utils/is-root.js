export default () => {
  return process.getuid && process.getuid() === 0
}
