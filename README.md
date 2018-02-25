# dep

A little Node.js dependency installer with the bare minimum features for module **end-users**.

<a href="#backers" alt="sponsors on Open Collective"><img src="https://opencollective.com/dep/backers/badge.svg" /></a> <a href="#sponsors" alt="Sponsors on Open Collective"><img src="https://opencollective.com/dep/sponsors/badge.svg" />

[<img src="https://raw.githubusercontent.com/depjs/artwork/master/logo-500x500.png" align="right" width="140">](https://github.com/depjs/dep)

###### ToDo
+ Follow the spec of npm's [package-lock.json]
+ `install [--global]`
+ Installing packages in multiple forked clusters

### Table of Contents

<li><a href="#features">Features</a></li>
<li><a href="#usage">Usage</a></li>
<li><a href="#concepts">Concepts</a></li>
<li><a href="#installation">Installation</a></li>
<li><a href="#uninstallation">Uninstallation</a></li>
<li><a href="#contributing">Contributing</a></li>
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

### Save spaces
Speed and local disk capacity are a trade-off. To take the both benefits, it would be better to have the cache in somewhere proxy layer instead of local.

Therefore, dep does not make cache files in a local disc for now.

### Stability
Stability is a core value. Having a small set makes keeping the green badges easier.

| Linux | Windows | Node.js LTS | Coverage |
| :-: | :-: | :-: | :-: |
| [![travis][t-img]][t-url] | [![appveyor][a-img]][a-url] | [![Node.js LTS][n-img]][n-url] | [![coverage][c-img]][c-url] |

## Installation
Since dep works independently of npm, dep has a standalone script to install.

### Standalone script
```console
$ curl -L https://github.com/depjs/dep/raw/master/scripts/install.js | node
```

### via npm
```console
$ npm install --global dep
```

## Uninstallation
Also for uninstallation.

### Standalone script
```console
$ curl -L https://github.com/depjs/dep/raw/master/scripts/uninstall.js | node
```

### via npm
```console
$ npm uninstall --global dep
```

## Contributing

See [CONTRIBUTING.md][] for more info.

### Contributors

The core code of this project exists thanks to all the contributors.

<a href="https://github.com/depjs/dep/graphs/contributors"><img src="https://opencollective.com/dep/contributors.svg?width=890" /></a>

### Sponsors

Be a sponsor and give us a high motivation. [[Become a sponsor][]]

<a href="https://github.com/depjs/dep/graphs/contributors"><img src="https://opencollective.com/dep/sponsors.svg?width=890" /></a>

### Backers

Become a backer and buy us a coffee every month. [[Become a backer][]]

<a href="https://github.com/depjs/dep/graphs/contributors"><img src="https://opencollective.com/dep/backers.svg?width=890" /></a>

## License
[MIT][]

[t-img]: https://img.shields.io/travis/depjs/dep/master.svg
[t-url]: https://travis-ci.org/depjs/dep
[a-img]: https://img.shields.io/appveyor/ci/depjs/dep/master.svg
[a-url]: https://ci.appveyor.com/project/depjs/dep/branch/master
[n-img]: https://img.shields.io/node/v/lts.svg
[n-url]: https://github.com/nodejs/LTS#lts-schedule1
[c-img]: https://img.shields.io/coveralls/depjs/dep/master.svg
[c-url]: https://coveralls.io/github/depjs/dep
[npm]: https://github.com/npm/npm
[git repository]: https://github.com/watilde/emoji-cli
[twitter]: https://twitter.com/watilde
[package-lock.json]: https://github.com/npm/npm/blob/latest/doc/spec/package-lock.md
[CONTRIBUTING.md]: https://github.com/depjs/dep/blob/master/.github/CONTRIBUTING.md
[MIT]: https://github.com/depjs/dep/blob/master/LICENSE
[Become a sponsor]: https://opencollective.com/dep#sponsor
[Become a backer]: https://opencollective.com/dep#backer
