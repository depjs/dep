# ttl [![Build Status](https://travis-ci.org/mrhooray/ttl.svg?branch=master)](https://travis-ci.org/mrhooray/ttl)
> Simple in-memory cache for JavaScript

## Installation
```shell
$ npm install ttl --save
```

## Usage
```js
var Cache = require('ttl');
var cache = new Cache({
    ttl: 10 * 1000,
    capacity: 3
});

cache.on('put', function(key, val, ttl) { });
cache.on('del', function(key, val) { });
cache.on('drop', function(key, val, ttl) { });
cache.on('hit', function(key, val) { });
cache.on('miss', function(key) { });

cache.put('foo', 'bar');
cache.put('ping', 'pong', 20 * 1000);
cache.put('yo', 'yo', 30 * 1000);
cache.put('whats', 'up'); // emit 'drop' event

cache.get('foo');     // > 'bar'
cache.get('yo');      // > 'yo'
cache.get('ping');    // > 'pong'
cache.get('lol');     // > undefined

// after 10 seconds
cache.get('foo');     // > undefined
cache.size();         // > 2
cache.del('ping')     // > 'pong'
cache.get('ping');    // > undefined
cache.size();         // > 1
cache.clear();
cache.size();         // > 0
```

## License
MIT
