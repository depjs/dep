# flat-tree

A series of functions to map a binary tree to a list

```
npm install flat-tree
```

[![build status](http://img.shields.io/travis/mafintosh/flat-tree.svg?style=flat)](http://travis-ci.org/mafintosh/flat-tree)

## Usage

You can represent a binary tree in a simple flat list using the following structure

```
      3
  1       5
0   2   4   6  ...
```

This module exposes a series of functions to help you build and maintain this data structure

``` js
var tree = require('flat-tree')
var list = []

var i = tree.index(0, 0) // get array index for depth: 0, offset: 0
var j = tree.index(1, 0) // get array index for depth: 1, offset: 0

// use these indexes to store some data

list[i] = 'a'
list[j] = 'b'
list[tree.parent(i)] = 'parent of a and b'
```

## API

#### `index = tree.index(depth, offset)`

Returns an array index for the tree element at the given depth and offset

#### `parentIndex = tree.parent(index)`

Returns the index of the parent element in tree

#### `siblingIndex = tree.sibling(index)`

Returns the index of this elements sibling

#### `children = tree.children(index)`

Returns an array `[leftChild, rightChild]` with the indexes of this elements children.
If this element does not have any children it returns `null`

#### `range = tree.spans(index)`

Returns the range (inclusive) the tree root at `index` spans.
For example `tree.spans(3)` would return `[0, 6]` (see the usage example).

#### `index = tree.leftSpan(index)`

Returns the left spanning in index in the tree `index` spans.

#### `index = tree.rightSpan(index)`

Returns the right spanning in index in the tree `index` spans.

#### `count = tree.count(index)`

Returns how many nodes (including parent nodes) a tree contains

#### `depth = tree.depth(index)`

Returns the depth of an element

#### `offset = tree.offset(index, [depth])`

Returns the relative offset of an element

#### `roots = tree.fullRoots(index)`

Returns a list of all the full roots (subtrees where all nodes have either 2 or 0 children) `<` index.
For example `fullRoots(8)` returns `[3]` since the subtree rooted at `3` spans `0 -> 6` and the tree
rooted at `7` has a child located at `9` which is `>= 8`.

#### `iterator = tree.iterator(index)`

Create a stateful tree iterator starting at a given index.
The iterator exposes the following methods.

#### `index = iterator.next()`

Move the iterator the next item in the tree.

#### `index = iterator.prev()

Move the iterator the prev item in the tree.

#### `iterator.seek(index)`

Move the iterator the this specific tree index.

#### `index = iterator.parent()`

Move the iterator to the current parent index

#### `index = iterator.leftChild()`

Move the iterator to the current left child index.

#### `index = iterator.rightChild()`

Move the iterator to the current right child index.

#### `index = iterator.leftSpan()`

Move the iterator to the current left span index.

#### `index = iterator.rightSpan()`

Move the iterator to the current right span index.

#### `bool = iterator.isLeft()`

Is the iterator at a left sibling?

#### `bool = iterator.isRight()`

Is the iterator at a right sibling?

#### `index = iterator.sibling()`

Move the iterator to the current sibling

## License

MIT
