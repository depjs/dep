quack-array
===========

Does it quack like an array?

If so, turn an object into one!

examples
========

shallow
-------

    > var quack = require('quack-array');
    > quack({ 0 : 'a', 1 : 'b' })
    [ 'a', 'b' ]
    > quack({ 0 : 'a', 1 : 'b', x : 'c' })
    { '0': 'a', '1': 'b', x: 'c' }

deep
----

    > var quack = require('quack-array');
    > quack.deep({ 0 : { 0 : 'a', 1 : 'b' }, 1 : 'c' })
    [ [ 'a', 'b' ], 'c' ]

methods
=======

    var quack = require('quack-array');

quack(obj)
----------

If `obj` quacks like an array, return a new array with its elements.
Otherwise return `obj`.

Arrays have:

* one or more elements
* all enumerable keys are `>= 0`, integers, or 'length'

quack.deep(obj)
---------------

Call `quack()` recursively on every element in `obj`.

install
=======

With [npm](http://npmjs.org) just do:

    npm install quack-array
