node-parse-url
==============

[![npm](https://img.shields.io/npm/v/node-parse-url.svg)](https://www.npmjs.org/package/node-parse-url)

Take a URL string, and return an object. Extend from native url module

## Installation

Global
```
npm install node-parse-url
```

## Usage

```js

var parseUrl = require('node-parse-url');

var url = parseUrl('https://github.com/aredo');

console.log(url);

// output

// { 
//   protocol: 'https:',
//   host: 'github',
//   port: null,
//   hostname: 'github.com',
//   path: '/aredo',
//   subdomain: null,
//   tld: 'com',
//   domain: 'github.com' 
// }

```

## License
(The MIT License)
