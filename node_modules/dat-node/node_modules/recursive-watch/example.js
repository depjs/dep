var watch = require('./')

watch('.', function (filename) {
  console.log('something changed with', filename)
})
