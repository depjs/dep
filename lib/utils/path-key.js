// The environment variable that holds the executable search path. On Windows
// it is usually 'Path', but the exact casing isn't guaranteed, so reuse the
// existing key if one is present.
const pathKey = () => {
  if (process.platform !== 'win32') return 'PATH'
  const found = Object.keys(process.env).find((key) => /^PATH$/i.test(key))
  return found || 'Path'
}

export default pathKey()
