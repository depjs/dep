# dep

[<img src="logo.png" align="right" width="140">](https://github.com/depjs/dep)

A little Node.js dependency installer for module **end-users**.

[![github-actions][g-img]][g-url] [![codecov][c-img]][c-url]

dep aims to match npm's interface for the features it covers, while keeping the
internals small: it ships with **zero runtime dependencies**.

- **[Install](#install)** the dependencies defined in a local package.json.
- **[Lock](#lock)** the dependencies installed in a local node_modules.
- **[Run](#run)** an arbitrary command from the scripts in a local package.json.
- **[Workspaces](#workspaces)** in a monorepo, installed and locked together.

### Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [Install](#install)
  - [Lock](#lock)
  - [Run](#run)
- [Workspaces](#workspaces)
- [npm compatibility](#npm-compatibility)
- [Benchmark](#benchmark)
- [Concepts](#concepts)
- [Contributing](#contributing)
- [License](#license)

## Installation

dep requires Node.js `>=20.19.0`.

```console
$ npm install --global dep
```

To uninstall:

```console
$ npm uninstall --global dep
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

## Commands

### Install

#### `dep install`

Install all the dependencies defined in a local package.json.

#### `dep install <package name>[@{version|resource}]`

Install a specific package, just like `npm install`:

```console
$ dep install webpack
```

#### `dep install --save[={dev|prod}] <package name>[@{version|resource}]`

Install a package and save it to your package.json. `--save` (or `--save=prod`)
writes to `dependencies`; `--save=dev` or `--save-dev` writes to
`devDependencies`. When no version is given, the resolved version is saved with
the `^` prefix.

```console
$ dep install webpack --save
$ dep install webpack --save-dev
```

#### `dep install --only={dev|prod}`

Install only `dependencies` or only `devDependencies`:

```console
$ dep install --only=prod
```

### Lock

#### `dep lock`

Resolve the dependencies defined in a local package.json and write a
`package-lock.json` that follows the spec of npm's [package-lock.json]
(`lockfileVersion: 3`). The lockfile records each package's resolved version,
`resolved` URL, and `integrity`, so npm can read it as well.

```console
$ dep lock
```

### Run

#### `dep run <script> [-- <args>]`

Look up `<script>` in the `scripts` field of the local package.json and execute
its value:

```console
$ dep run test
```

Pass additional arguments after `--`:

```console
$ dep run build -- dist/bundle.js
```

#### `dep run`

Without a script name, `dep run` lists every script defined in the local
package.json:

```console
$ dep run
Available scripts via `dep run`

dep run build:
  webpack src/index.js
dep run test:
  node --test "test/*.js"
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
| `overrides` | ✅ Supported | Global (`{ "foo": "1.2.3" }`), parent-scoped nesting (`{ "parent": { "child": "1" } }`), and `$`-references. Version-qualified targets (`"foo@2"`) are ignored. |
| Aliased specifiers (`pkg@npm:other`) | ✅ Supported | Installs the target package under the alias name; the lockfile records the real `name`. (Registry targets only.) |
| `.npmrc` config | 🟡 Partial | Reads `registry`, `save-prefix`, and `engine-strict` from `~/.npmrc`. No auth tokens, scoped registries, or most other config keys. |
| Private / authed registries | ➖ Out of scope | Requests are unauthenticated; only an open registry is supported. |
| `npm-shrinkwrap.json` | ➖ Out of scope | Intentionally unsupported as a legacy format: dep reads and writes `package-lock.json` exclusively and ignores any `npm-shrinkwrap.json`. |
| Commands beyond install/lock/run | ➖ Out of scope | No `ci`, `update`, `uninstall`, `dedupe`, `audit`, `fund`, `outdated`, `publish`, `version`, `exec`/`npx`, etc. |

✅ Supported &nbsp;·&nbsp; 🟡 Partial &nbsp;·&nbsp; ➖ Intentionally out of scope

## Benchmark

Installing a 12-dependency app (`express`, `lodash`, `rxjs`, `axios`,
`chokidar`, …), with yarn pinned to the `node-modules` linker so all four
produce a comparable `node_modules`. Lower is better.

**Cold** — no lockfile, a fresh isolated cache for every run:

| Tool | Cold install | Relative |
| --- | --- | --- |
| npm 11 | ~2.9s | 1.0× |
| yarn 4 | ~1.25s | ~2.3× faster |
| pnpm 11 | ~0.95s | ~3.0× faster |
| **dep** | **~0.79s** | **~3.6× faster** |

**Warm** — lockfile present and cache/store warm; only `node_modules` is removed
before each run (the usual reinstall / cached-CI case). For dep this is a
`package-lock.json`-driven install (`npm ci` for npm, `--immutable` for yarn,
`--frozen-lockfile` for pnpm):

| Tool | Warm install | Relative |
| --- | --- | --- |
| npm 11 | ~1.45s | 1.0× |
| yarn 4 | ~0.75s | ~1.9× faster |
| pnpm 11 | ~0.55s | ~2.6× faster |
| **dep** | **~0.44s** | **~3.3× faster** |

<sub>avg of 5 runs on one Linux machine, Node 24, against the public registry —
numbers vary by machine, network, and dependency set.</sub>

Reproduce it yourself:

```console
$ node scripts/benchmark.js
```

**Caveat:** dep keeps **no local cache** by design (see
[Save spaces](#save-spaces)). Even in the warm case it *re-downloads* tarballs
(it only skips re-resolving the tree from the lockfile), so its warm speed is
network-bound. pnpm/npm/yarn serve cached packages from disk and can even
install offline — on a slow or offline network they stay fast while dep does
not. These numbers reflect a fast connection to the registry.

## Concepts

### End users

The target user is the module **end-user**: someone who builds things *with*
`node_modules` rather than publishing packages. The goal of this project is to
reproduce the features those end-users rely on day to day.

### Save spaces

Speed and local disk capacity are a trade-off. To get the best of both, caching
belongs in a proxy layer rather than on the local machine — so dep does not
write cache files to the local disk, for now.

### Stability

Stability is a core value, and a small feature set makes keeping the green
badges easier. dep has **zero runtime dependencies** — everything is built on
the Node.js standard library — and resolves the dependency tree
deterministically, with bounded concurrency to avoid exhausting sockets and
file handles: downloads/extractions run 16-wide and metadata resolution 64-wide
by default (tunable via the `DEP_CONCURRENCY` and `DEP_RESOLVE_CONCURRENCY`
environment variables; an explicit `DEP_CONCURRENCY` throttles both).

## Contributing

See [CONTRIBUTING.md][] for more info.

## License

[MIT][]

[g-img]: https://github.com/depjs/dep/workflows/Node.js%20CI/badge.svg
[g-url]: https://github.com/depjs/dep/actions
[c-img]: https://codecov.io/gh/depjs/dep/branch/master/graph/badge.svg
[c-url]: https://codecov.io/gh/depjs/dep
[package-lock.json]: https://github.com/npm/npm/blob/latest/doc/spec/package-lock.md
[CONTRIBUTING.md]: https://github.com/depjs/dep/blob/master/.github/CONTRIBUTING.md
[MIT]: https://github.com/depjs/dep/blob/master/LICENSE
