var quack = require('../');
var assert = require('assert');

exports.shallow = function () {
    assert.deepEqual(quack({ 0 : 'a', 1 : 'b' }), [ 'a', 'b' ]);
    
    var obj = { 0 : 'a', 1 : 'b', x : 'c' };
    assert.equal(quack(obj), obj);
};

exports.deep = function () {
    assert.deepEqual(
        quack.deep({
            0 : { 0 : 'a', 1 : 'b', 2 : 'c' },
            1 : 'd'
        }),
        [ [ 'a', 'b', 'c' ], 'd' ]
    );
    
    assert.deepEqual(
        quack.deep({
            0 : { 0 : 'a', 1 : 'b', 2 : 'c' },
            1 : 'd'
        }),
        [ [ 'a', 'b', 'c' ], 'd' ]
    );
};

exports.discontiguous = function () {
    var obj = { 0 : 'a', 2 : 'b' };
    assert.deepEqual(
        JSON.stringify(quack(obj)),
        JSON.stringify([ 'a', null, 'b' ])
    );
};

exports.indexOffset = function () {
    var obj = { 1 : 'a', 2 : 'b', 3 : 'c' };
    assert.equal(
        JSON.stringify(quack(obj)),
        JSON.stringify([ null, 'a', 'b', 'c' ])
    );
};

exports.empty = function () {
    var obj = {};
    assert.equal(quack(obj), obj);
};

exports.single = function () {
    var obj = { 0 : 'a' };
    assert.deepEqual(quack(obj), [ 'a' ]);
};

exports.isArray = function () {
    var obj = [ 'a', 'b', 'c' ];
    assert.equal(quack(obj), obj);
};

exports.enumLen = function () {
    var obj = { 0 : 'a', 1 : 'b', length : 2 };
    assert.deepEqual(quack(obj), [ 'a', 'b' ]);
};
