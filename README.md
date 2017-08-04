# dep

A little Node.js dependency installer with the bare minimum features for module **end-users**.

###### Roadmap to v1.0.0
+ Stand alone installer
+ Follow the spec of npm's [package-lock.json]
+ `install <pkg> [--save|--save-dev|--global]`

### Table of Contents

<li><a href="#features">Features</a></li>
<li><a href="#usage">Usage</a></li>
<li><a href="#installation">Installation</a></li>
<li><a href="#chat">Chat</a></li>
<li><a href="#license">License</a></li>

## Features
+ **Install** the dependencies defined in a local package.json.
+ **Lock** the dependencies installed in a local node_modules.
+ **Run** an arbitrary command from scripts in a local package.json.

dep is trying to have a similar/same interface of the features with npm, but there are some slightly different implementations internally.

### Right permission
To avoid from the risks related the lifecycle install scripts of the package while installing, dep doesn't allow you to run them if you are running `dep install` as a root user.

### Save spaces
Speed and local disk capacity are a trade-off. To take the both benefits, it would be better to have the cache in somewhere proxy layer instead of local.

Therefore, dep does not make cache files in a local disc for now.

### Stability
Stability is a core value. Having a small set makes keeping the green badges easier.

| Mac/Linux | Windows | Node.js LTS | Coverage |
| :-: | :-: | :-: | :-: |
| [![travis][t-img]][t-url] | [![appveyor][a-img]][a-url] | [![Node.js LTS][n-img]][n-url] | [![coverage][c-img]][c-url] |

### dep ♥ [dat]
This feature is **experimental**.

You can provide a [dat] link as a dependency source.
A dat link is like an `http:// link`, but with special properties.

Here is an example package.json with a dat called [emoji-cli]. It just contains the package data as like its [git repository].
```json
{
  "name": "an-app",
  "description": "an example app",
  "dependencies": {
    "emoji-cli": "dat://7fdbb7b4ea8be0e5d9c1469aa4056377a092d8787b6e3452faf0ce8390098d02"
  }
}
```

## Usage
```console
$ dep -h
A little Node.js dependency installer

Commands:
  install  Install dependencies defined in package.json             [aliases: i]
  lock     Lock dependencies installed in node_modules              [aliases: l]
  run      Run an arbitrary command from scripts in package.json    [aliases: r]

Options:
  --help, -h     Show help                                             [boolean]
  --version, -v  Show version information                              [boolean]
```

## Installation
Currently, [npm] is the only way to install dep:
```console
$ npm install -g dep
```

## Bug report
When you find issues, please report them:
+ https://github.com/watilde/dep/issues/new

Be sure to follow the issue template.


## Feature request
We're trying to find out the bare minimum features for end users. That means it is very reluctant to add new features, but having a discussion is useful for clarifying the minimum definitions.

Feel free to ask us in #dep-js on https://package.community/ or on [twitter].


## License
[MIT](./LICENSE)

[t-img]: https://img.shields.io/travis/watilde/dep/master.svg
[t-url]: https://travis-ci.org/watilde/dep
[a-img]: https://img.shields.io/appveyor/ci/watilde/dep/master.svg
[a-url]: https://ci.appveyor.com/project/watilde/dep/branch/master
[n-img]: https://img.shields.io/node/v/lts.svg
[n-url]: https://github.com/nodejs/LTS#lts-schedule1
[c-img]: https://img.shields.io/coveralls/watilde/dep/master.svg
[c-url]: https://coveralls.io/github/watilde/dep
[npm]: https://github.com/npm/npm
[dat]: https://datproject.org/
[emoji-cli]: https://datproject.org/watilde/emoji-cli
[git repository]: https://github.com/watilde/emoji-cli
[twitter]: https://twitter.com/watilde
[package-lock.json]: https://github.com/npm/npm/blob/latest/doc/spec/package-lock.md
