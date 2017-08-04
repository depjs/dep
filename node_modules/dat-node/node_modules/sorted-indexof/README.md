# sorted-indexof

Given two sorted arrays, a and b, efficiently return an array of indexes
of b's elements in a.

Runs in `O(n+m)` where n and m are the sizes of the sorted arrays.

```
npm install sorted-indexof
```

[![Build Status](https://travis-ci.org/mafintosh/sorted-indexof.svg?branch=master)](https://travis-ci.org/mafintosh/sorted-indexof)

## Usage

``` js
var indexOf = require('sorted-indexof')

var a = ['b', 'c', 'd', 'e', 'f']
var b = ['a', 'b', 'c', 'f', 'g', 'h']

console.log(indexOf(a, b))
```

Running the above returns

```
[ -1, 0, 1, 4, -1, -1 ]
```

Which corresponds to taking each element of `b` and running `a.indexOf(el)`.

## API

#### `var indexes = indexOf(a, b)`

Returns an array of indexes of `b`s elements in `a`.
An an element in `b` does not exist in `a`, `-1` is inserted.

Note that `a` and `b` MUST be sorted.

## License

MIT
