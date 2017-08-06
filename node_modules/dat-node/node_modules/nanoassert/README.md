# `nanoassert`

> Nanoscale assertion module

## Usage

```js
var assert = require('nanoassert')

assert(a !== b, `${a} !== ${b}`)
```

## API

### `assert(declaration, [message])`

Assert that `declaration` is truthy otherwise throw `Error` with
optional `message`, which defaults to `AssertionError`. If you want friendlier
messages you can use template strings to show the assertion made like in the
example above.

## Why

I like to write public facing code very defensively, but have complaints about
the size incurred by the `assert` module. I only use the top-level `assert`
method anyway, so this should make everyone happy :)

## Install

```sh
npm install nanoassert
```

## License

[ISC](LICENSE)
