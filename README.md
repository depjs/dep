# dep

A little Node.js dependency installer with the bare minimum features for module **end-users**.

[<img src="https://raw.githubusercontent.com/depjs/artwork/master/logo-500x500.png" align="right" width="140">](https://github.com/depjs/dep)

### Table of Contents

<li><a href="#features">Features</a></li>
<li><a href="#workspaces">Workspaces</a></li>
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
+ **<a href="#workspaces">Workspaces</a>** in a monorepo, installed and locked together.

dep is trying to have a similar/same interface of the features with npm, but there are some slightly different implementations internally. It ships with **zero runtime dependencies**.

### Install
#### `dep install`
Install all the dependencies defined in a local package.json.

#### `dep install <package name>(@{version|resource})`
You can install a package as like `npm install`.

```console
$ dep install webpack
```

#### `dep install --save[={dev|prod}] <package name>(@{version|resource})`
You can install the package and save it to your package.json. `--save` (or
`--save=prod`) writes to `dependencies`; `--save=dev` or `--save-dev` writes to
`devDependencies`. When no version is given, the resolved version is saved with
the `^` prefix.

```console
$ dep install webpack --save
$ dep install webpack --save-dev
```

#### `dep install --only={dev|prod}`
You can install either only `dependencies` or `devDependencies` by using `--only={dev|prod}`.

```console
$ dep install --only=prod
```

### Lock
#### `dep lock`
Resolve the dependencies defined in a local package.json and write a
`package-lock.json` that follows the spec of npm's [package-lock.json]
(`lockfileVersion: 3`). The lockfile records each package's resolved version,
`resolved` URL and `integrity`, so it can be read by npm as well.

```console
$ dep lock
```

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

## Workspaces
dep supports monorepos through the npm-style `workspaces` field in the root
package.json (an array of globs, or `{ "packages": [...] }`).

```json
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

#### `dep install`
Running install at the root resolves and **hoists** every workspace's
dependencies into the root `node_modules`, and **symlinks** each workspace
package into `node_modules` (with its bins) so cross-workspace imports resolve.

#### `dep install <package name> -w <workspace>`
Add a package to a specific workspace. The workspace is matched by its name or
by its path relative to the root, and the package is saved to that workspace's
package.json. Use `--save-dev` to save it to `devDependencies`, and repeat `-w`
to target several workspaces.

```console
$ dep install lodash -w @scope/a
$ dep install tap -w packages/b --save-dev
```

#### `dep lock [-w <workspace>]`
`dep lock` records workspaces in `package-lock.json` the npm way: a source entry
at each workspace's path plus a `link` entry under `node_modules`. Pass
`-w <workspace>` to narrow the lockfile to the given workspace(s).

```console
$ dep lock
$ dep lock -w @scope/a
```

## Usage
```console
$ dep -h
A little Node.js dependency installer

Usage: dep <command> [options]

Commands:
  install, i    Install dependencies defined in package.json
  lock, l       Lock dependencies installed in node_modules
  run, r        Run an arbitrary command from scripts in package.json

Options:
  --save                  Save to dependencies (--save=dev for devDependencies)
  --save-dev              Save to devDependencies
  --only=prod|dev         Install only prod or dev dependencies
  -w, --workspace <name>  Add the package(s) to the named workspace(s)
  -h, --help              Show help
  -v, --version           Show version information
```

## npm compatibility
dep deliberately implements a focused subset of npm. The table below is the
honest state of each feature — what works, what works partially, and what is
intentionally left out.

| Feature | Status | Notes |
| --- | --- | --- |
| `dependencies` | ✅ Supported | Resolved (deterministic, hoisted) and installed. |
| `devDependencies` | ✅ Supported | Root package only. Filter with `--only`, save with `--save-dev`. |
| `optionalDependencies` | ✅ Supported | Followed (including transitively); skipped without failing the install when they can't be resolved, fail to build, or don't match the current `os`/`cpu`. The lockfile keeps every platform's optionals, marked `optional`. |
| `peerDependencies` | ✅ Supported | Non-optional peers are auto-installed and hoisted (npm v7+ style); peers marked `optional` in `peerDependenciesMeta` are skipped. Recorded in `package-lock.json`. |
| `workspaces` | ✅ Supported | Globs (and `{ "packages": [...] }`). Hoisted install + symlinks, npm-style lockfile entries, and `-w, --workspace`. |
| `package-lock.json` (v3) | ✅ Supported | `dep lock` emits an npm-compatible `lockfileVersion: 3`, and a plain `dep install` reproduces it (skipping registry resolution). A stale lock, installing a specific package, `-w`, or `--only` falls back to a fresh resolve. |
| `bin` | ✅ Supported | Symlinks on POSIX; `.cmd`/`.ps1`/sh shims on Windows. |
| Lifecycle scripts | ✅ Supported | Dependencies run `preinstall`/`install`/`postinstall`. The local project and each workspace run the full `npm install` sequence: `preinstall` → (deps) → `install` → `postinstall` → `prepublish` → `prepare`. |
| `engines` / `os` / `cpu` | ✅ Supported | On install, a required dep whose `os`/`cpu` doesn't match fails (optional ones are skipped); `engines.node` mismatches warn, or fail under `engine-strict`. The lockfile stays cross-platform. |
| Integrity verification | ✅ Supported | Registry tarballs are hashed and checked against `integrity` (SRI sha512) or the legacy `shasum` before extraction; a mismatch fails the install. |
| `bundledDependencies` | ✅ Supported | A package's bundled deps ship inside its tarball, so they aren't re-fetched or hoisted out. |
| Dependency sources | ✅ Supported | Registry ranges/tags, git URLs (`git+https`, with `#commit`/`#semver:`), remote tarball URLs, and local file/directory paths. |
| `.npmrc` config | 🟡 Partial | Reads `registry`, `save-prefix`, and `engine-strict` from `~/.npmrc`. No auth tokens, scoped registries, or most other config keys. |
| Private / authed registries | ➖ Out of scope | Requests are unauthenticated; only an open registry is supported. |
| `overrides` | ➖ Out of scope | Dependency version overrides are ignored. |
| Aliased specifiers (`pkg@npm:other`) | ➖ Out of scope | npm package aliases are not resolved. |
| `npm-shrinkwrap.json` | ➖ Out of scope | dep reads and writes `package-lock.json` only. |
| Commands beyond install/lock/run | ➖ Out of scope | No `ci`, `update`, `uninstall`, `dedupe`, `audit`, `fund`, `outdated`, `publish`, `version`, `exec`/`npx`, etc. |

✅ Supported &nbsp;·&nbsp; 🟡 Partial &nbsp;·&nbsp; ➖ Intentionally out of scope

## Concepts

### End users
The target user is always module **end-user** who makes something with `node_modules` and doesn't make packages. And the goal of this project is to **reproduce** most of the features that the end-users use to build their stuff on daily basis.

### Save spaces
Speed and local disk capacity are a trade-off. To take the both benefits, it would be better to have the cache in somewhere proxy layer instead of local.

Therefore, dep does not make cache files in a local disc for now.

### Stability
Stability is a core value. Having a small set makes keeping the green badges
easier. dep has **zero runtime dependencies** — everything is built on the
Node.js standard library — and resolves the dependency tree deterministically,
with bounded concurrency (tunable via the `DEP_CONCURRENCY` environment
variable, default `16`) to avoid exhausting sockets and file handles.

[![github-actions][g-img]][g-url]

## Installation
dep requires Node.js `>=20.19.0`.

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

## License
[MIT][]

[g-img]: https://github.com/depjs/dep/workflows/Node.js%20CI/badge.svg
[g-url]: https://github.com/depjs/dep/actions
[npm]: https://github.com/npm/npm
[git repository]: https://github.com/watilde/emoji-cli
[twitter]: https://twitter.com/watilde
[package-lock.json]: https://github.com/npm/npm/blob/latest/doc/spec/package-lock.md
[CONTRIBUTING.md]: https://github.com/depjs/dep/blob/master/.github/CONTRIBUTING.md
[MIT]: https://github.com/depjs/dep/blob/master/LICENSE
