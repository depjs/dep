var encoding = require('.')

var link = '2fdiu7i6kpzx4h9qos6eqldjghd2ut5hx0e8bekm0bkwiax3dt'
var buf = encoding.decode(link)
console.log('%s -> %s', link, buf)
console.log('%s -> %s', buf, encoding.encode(buf))
