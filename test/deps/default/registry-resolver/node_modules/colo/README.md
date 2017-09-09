colo
=========

[![Build Status](https://travis-ci.org/yosuke-furukawa/colo.svg?branch=master)](https://travis-ci.org/yosuke-furukawa/colo)

colo is simple colorize module. No dependencies.

Node.js
---------

node.js colorize module.

```javascript
var colo = require("colo");


console.log(colo.red("colo colo"));
console.log(colo.cyan.bold("colo colo"));
console.log(colo.green.underline("colo colo"));
console.log(colo.magenta.italic("colo colo"));
console.log(colo.grey.inverse("colo colo"));
```

![demo](demo.png)

Browser
----------

```html
<script type='text/javascript' src="./colo/colo.js"></script>
<script type='text/javascript'>
colog(colo.red("colo colo"));
colog(colo.cyan.bold("colo colo"));
colog(colo.green.underline("colo colo"));
colog(colo.magenta.italic.bold("colo colo"));
colog(colo.grey.bold.italic.underline("colo colo"));
</script>
```

![browser](browser.png)
