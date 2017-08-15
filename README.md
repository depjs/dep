# dep

A little Node.js dependency installer with the bare minimum features for module **end-users**.

###### Roadmap to v1.0.0
+ Follow the spec of npm's [package-lock.json]
+ `install [--global]`
+ Installing packages in multiple forked clusters?

### Table of Contents

<li><a href="#features">Features</a></li>
<li><a href="#usage">Usage</a></li>
<li><a href="#concepts">Concepts</a></li>
<li><a href="#installation">Installation</a></li>
<li><a href="#uninstallation">Uninstallation</a></li>
<li><a href="#bug-report">Bug report</a></li>
<li><a href="#feature-request">Feature request</a></li>
<li><a href="#license">License</a></li>

## Features
+ **<a href="#install">Install</a>** the dependencies defined in a local package.json.
+ **<a href="#lock">Lock</a>** the dependencies installed in a local node_modules.
+ **<a href="#run">Run</a>** an arbitrary command from scripts in a local package.json.

dep is trying to have a similar/same interface of the features with npm, but there are some slightly different implementations internally.

### Install
#### `dep install`
Install all the dependencies defined in a local package.json.

#### `dep install <package name>(@{version|resource})`
You can install a package as like `npm install`.

```console
$ dep install webpack
```

#### `dep install --save={dev|prod} <package name>(@{version|resource})`
You can install the package and save it to either `dependencies` or `devDependencies` by using `--only={dev|prod}`.

```console
$ dep install webpack --save=dev
```

#### `dep install --only={dev|prod}`
You can install either only `dependencies` or `devDependencies` by using `--only={dev|prod}`.

```console
$ dep install --only=prod
```

#### `dep install --global`
ToDo.

### Lock
#### `dep lock`
ToDo.

It will follow the spec of npm's [package-lock.json].

### Run
#### `dep run [script] -- <args>`
This command will take the matched key with provided  `[script]` among the scripts field defined in package.json and execute the value.

```console
$ dep run test
```

You also can provide additional arguments by putting `--`.

```console
$ dep run build -- dist/bundle.js
```

#### `dep run`
If you do not give an arbitrary [script] to `dep run`, it lists all of the commands from scripts in a local package.json.

```console
$ dep run
Available scripts via `dep run`

dep run build:
  webpack src/index.js
dep run test:
  tap "test/*.js"
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

## Concepts

### End users
The target user is always module **end-user** who makes something with `node_modules` and doesn't make packages. And the goal of this project is to **reproduce** most of the features that the end-users use to build their stuff on daily basis.

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

## Installation
Since dep works independently of npm, dep has a standalone script to install.

### Standalone script
```console
$ curl -L https://github.com/watilde/dep/raw/master/scripts/install.js | node
```

### via npm
```console
$ npm install --global dep
```

## Uninstallation
Also for uninstallation.

### Standalone script
```console
$ curl -L https://github.com/watilde/dep/raw/master/scripts/uninstall.js | node
```

### via npm
```console
$ npm uninstall --global dep
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
