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

- [Design principles](#design-principles)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [Install](#install)
  - [Lock](#lock)
  - [Run](#run)
- [Workspaces](#workspaces)
- [npm compatibility](#npm-compatibility)
- [Benchmark](#benchmark)
- [Why dep has no cache](#why-dep-has-no-cache)
- [Stability](#stability)
- [Contributing](#contributing)
- [License](#license)

## Design principles

**A thin client.** dep resolves a dependency tree, downloads it, verifies it,
and links it — nothing else. Less code and less state mean fewer failure modes.

**npm-compatible where it counts.** Same package.json, same `package-lock.json`
(v3), same `node_modules` layout. Try dep on an existing project today and
switch back tomorrow; nothing to migrate either way.

**Zero runtime dependencies.** Everything is built on the Node.js standard
library, so the installer can't be compromised through its own dependency
tree — and the whole codebase is small enough to audit in an afternoon.

**Caching belongs to infrastructure.** dep keeps no local package cache: a
caching registry proxy (Verdaccio, Nexus, Artifactory) serves the whole team
with standard HTTP semantics, instead of a mutable store duplicated on every
machine. See [Why dep has no cache](#why-dep-has-no-cache) for the rationale
and a two-minute proxy setup.

**Built for end-users, not library authors.** dep is for people who build
things *with* `node_modules`, not people who publish packages. It installs,
locks, and runs — publishing, versioning, and auditing belong to other tools.

These principles decide what's in and what's out — see the
[npm compatibility](#npm-compatibility) table for the honest consequences.

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
honest state of each feature — what works, what works partially, and what the
[design principles](#design-principles) place out of scope.

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
| Private / authed registries | ✅ Supported | Registry-level token auth via standard `.npmrc`: `//host/:_authToken=<token>` (Bearer) or the legacy `//host/:_auth` (Basic), with `${NPM_TOKEN}`-style env expansion. Tokens are matched by host (and path prefix) and never sent elsewhere. No login command, no scoped registries. |
| `.npmrc` config | 🟡 Partial | Reads `registry`, `save-prefix`, `engine-strict`, and the auth keys above; a project-local `.npmrc` overrides `~/.npmrc`. No scoped registries or most other config keys. |
| Local package cache | ➖ By design | Caching belongs to infrastructure: point dep at a caching proxy (Verdaccio, Nexus, Artifactory) via `registry` in `~/.npmrc`. See [Why dep has no cache](#why-dep-has-no-cache). |
| `npm-shrinkwrap.json` | ➖ By design | One lock format, npm's current one: dep reads and writes `package-lock.json` (v3) exclusively and ignores any `npm-shrinkwrap.json`. |
| Commands beyond install/lock/run | ➖ By design | Follows from the end-user scope: no `publish`, `version`, `audit`, `fund`, `outdated`, `exec`/`npx`, and no `ci`, `update`, `uninstall`, `dedupe`, etc. |

✅ Supported &nbsp;·&nbsp; 🟡 Partial &nbsp;·&nbsp; ➖ By design — a consequence of the [principles](#design-principles)

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

**Caveat:** dep keeps **no local cache** — see
[Why dep has no cache](#why-dep-has-no-cache) below. Even in the warm case it
*re-downloads* tarballs (it only skips re-resolving the tree from the
lockfile), so its warm speed is network-bound. pnpm/npm/yarn serve cached
packages from disk and can even install offline — on a slow or offline network
they stay fast while dep does not. These numbers reflect a fast connection to
the registry; with a caching registry proxy on your network, every install
runs at LAN speed.

## Why dep has no cache

Every Node.js package manager ships a cache. npm has `~/.npm` and the cacache
content-addressable store. yarn has its cache directory and, in Berry, a whole
zip-based offline mirror. pnpm's global store is the centerpiece of its design.
The assumption is so universal that it reads like a requirement: a package
manager *is* a downloader plus a cache.

dep has no cache. Not "no cache yet" — no cache on purpose. Every install
downloads every tarball from the registry, verifies it against the lockfile,
and extracts it into `node_modules`. That's the whole lifecycle.

This sounds like a limitation. This section makes the case that it's a
feature, and that the cache you actually want belongs somewhere else entirely.

<details>
<summary><b>Read the full rationale</b> — what client caches cost, the trade-offs, and a two-minute proxy recipe</summary>

### What client-side caches actually cost

`npm cache clean --force` is a meme for a reason. It's the
"turn it off and on again" of the Node ecosystem — the first reply under every
`EINTEGRITY` error, every `sha512 integrity checksum failed... but expected`,
every mysteriously half-extracted package. The command even makes you say
`--force`, npm's own acknowledgment that you shouldn't need to do this, and
yet everyone eventually does.

That's not an npm-specific failure. It's what a client-side cache *is*: a
long-lived, mutable, concurrently-written database sitting on thousands of
machines, maintained by a tool whose primary job is something else. The
failure modes are structural:

- **Corruption.** An interrupted download, a full disk, or a crashed process
  leaves a truncated tarball behind. The next install trusts the cache and
  fails with an integrity error that looks like a registry problem — the
  wrongness surfaces far from its cause.
- **Concurrency.** Two package-manager processes writing the same store need
  locking, and locking across processes on three operating systems is where
  bugs live. Every mainstream package manager has shipped, and fixed, races
  in its cache layer.
- **Permissions.** One `sudo npm install` and parts of your cache are owned
  by root. Everything works until it doesn't, days later, in a different
  project.
- **Complexity in the client.** cacache alone — the thing that makes npm's
  cache safe(ish) — is a nontrivial content-addressable store with SRI
  indexing, garbage collection, and its own dependency tree. That machinery
  has to be shipped, versioned, and debugged inside every client install.
- **Duplication.** The same `react` tarball sits in the cache of every laptop
  on your team and gets rebuilt into every CI runner. In CI it's often worse
  than useless: uploading and restoring hundreds of megabytes through
  `actions/cache`, with hand-rolled cache keys, regularly costs more time
  than the downloads it was supposed to save.

None of this means caches are bad. It means a *per-machine cache inside the
client* is an expensive place to put one.

### Caching is an infrastructure concern

Here's the thing about npm packages: a published version is immutable.
`lodash@4.17.21` will never change. This is the single easiest caching
problem in computing — cache forever, never invalidate — and we've had
boring, battle-tested software for exactly that problem for decades: HTTP
proxies.

A caching registry proxy — [Verdaccio](https://verdaccio.org), Nexus,
Artifactory — gives you everything the client-side cache promised, in a
better place:

- **Shared, not duplicated.** The first person to install a package pays the
  registry round-trip; everyone else on the team, and every CI job, gets it
  from the local network. A per-machine cache can never do this.
- **Standard semantics.** It's HTTP. You can observe it, size it, and reason
  about it with tools you already know, instead of spelunking through a
  package manager's store format.
- **Offline resilience where it matters.** When the public registry has an
  outage, your CI keeps working as long as the proxy has the tarballs. That's
  the offline scenario that actually costs money — not the laptop on a plane.
- **One cache, owned by the layer that owns caching.** Your proxy doesn't
  also resolve semver or run lifecycle scripts. Separation of concerns cuts
  both ways.

And here's the part that makes this less radical than it sounds: **most
companies already run one.** If your team uses Nexus or Artifactory — for
private packages, for compliance, for audit trails — then every client-side
cache in your fleet is a *second* cache layered on top of the one you
already operate. For that environment, dep's model isn't a workaround; it's
the shape the system already had.

The obvious objection: *"you didn't remove the complexity, you just moved
it."* Yes — deliberately. Moved, not duplicated: one cache per team instead
of one per machine, run by software whose entire job is caching, instead of
being a side quest inside an installer. "Move the hard part to the layer
that owns it" is the whole argument.

### What dep buys with the space

Deleting the cache isn't just deleting code. It changes what the client can be.

**Zero runtime dependencies.** dep is built entirely on the Node.js standard
library. No cacache, no tar chain, no store implementation — and therefore no
way to compromise the installer through its own dependency tree. In a year
when npm supply-chain attacks are a recurring news item, the installer being
small enough to audit in an afternoon is not a vanity metric.

**No state to corrupt.** dep's writable state is `node_modules` and
`package-lock.json`. Both are visible, versionable, and disposable.
`rm -rf node_modules && dep install` is a *complete* reset — there is no
hidden store that can stay poisoned. There is no dep equivalent of
`npm cache clean --force`, because there is nothing to clean.

**Verification on every install.** Every tarball is hashed off the wire and
checked against the lockfile's `integrity` before extraction, every time.
There is no "trusted because it was cached" path, so there is no cache-
poisoning path either.

**Predictability.** Every install does the same thing. No warm-versus-cold
behavioral differences, no "works after clearing the cache" class of bug
report. When something fails, the failure is about the network, the
registry, or the lockfile — things you can see.

### The trade-offs, plainly

This design has real costs, and they belong here in the README rather than
in a footnote.

**Cold installs on a laptop without a proxy re-download everything.** If you
create scratch projects all day on a hotel wifi connection, dep will feel
slower than a warm pnpm, full stop. dep is fast per install — it benchmarks
ahead of npm, yarn, and pnpm on cold installs with the network in the
picture — but it re-pays the network cost that a local cache would amortize.

**There is no offline mode out of the box.** No network, no proxy, no
install. pnpm can install a known project on a plane; dep cannot.

**pnpm's store also deduplicates disk.** Content-addressable storage plus
hard links means twenty projects share one copy of each package on disk.
That's a genuine benefit dep does not have and will not grow — disk-level
dedup is a store feature, and dep doesn't have a store.

**Most solo developers don't run a registry proxy.** True. If you're solo,
on a metered connection, installing frequently, and unwilling to run one
container — npm or pnpm will serve you better, and that's fine. dep is
opinionated about *where* caching belongs, and if that layer doesn't exist
in your setup, you're outside the opinion. The recipe below is for everyone
who's willing to spend two minutes changing that.

### The recipe: a caching proxy in two minutes

Verdaccio proxies the public registry and caches every tarball it serves.
One file:

```yaml
# docker-compose.yml
services:
  verdaccio:
    image: verdaccio/verdaccio:6
    ports:
      - "4873:4873"
    volumes:
      - verdaccio-storage:/verdaccio/storage

volumes:
  verdaccio-storage:
```

```console
$ docker compose up -d
```

Then point your client at it. dep reads the standard `registry` key from
`~/.npmrc`, so this one line configures dep — and npm, yarn, and pnpm —
at the same time:

```console
$ echo 'registry=http://localhost:4873/' >> ~/.npmrc
```

If your proxy requires a token (Nexus and Artifactory usually do), add npm's
standard auth line next to it — dep expands `${NPM_TOKEN}` from the
environment:

```console
$ echo '//npm-proxy.internal.example.com/:_authToken=${NPM_TOKEN}' >> ~/.npmrc
```

That's the entire migration. The first install populates the proxy; every
install after that is served from your own disk (or your team's server, if
you run it on the network instead of localhost) — with standard HTTP
behavior you can inspect at `http://localhost:4873`.

**In CI**, the same idea pays off most when the proxy *persists across
jobs*: run Verdaccio (or use your existing Nexus/Artifactory) as a
long-lived service on your network or alongside your self-hosted runners,
and set the registry line in the job:

```yaml
steps:
  - run: |
      echo 'registry=https://npm-proxy.internal.example.com/' >> ~/.npmrc
      echo '//npm-proxy.internal.example.com/:_authToken=${NPM_TOKEN}' >> ~/.npmrc
  - run: npx dep install --only=prod
    env:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Every job then installs at LAN speed with zero cache upload/download/restore
steps and zero cache keys to bust. (A per-job ephemeral Verdaccio container
starts empty each run, so it only helps jobs that install more than once —
prefer the persistent proxy.)

### Do one thing well

dep resolves a dependency tree, downloads it, verifies it, and links it.
That's the whole job, so that's the whole program.

Caching is real work, but it's *cross-cutting* work — it serves every client
on the network equally, it has its own operational lifecycle, and it's been
solved well by dedicated software for longer than npm has existed. Pulling
it into every client multiplies the state, the code, and the failure modes
by the number of machines you own. Pushing it to the layer that owns it
leaves the client small enough to read, to audit, and to trust.

dep has no cache for the same reason your text editor has no filesystem:
someone else already does that, better, one layer down.

</details>

## Stability

Stability is a core value, and a small feature set makes keeping the green
badges easier. dep resolves the dependency tree deterministically, with bounded
concurrency to avoid exhausting sockets and file handles: downloads/extractions
run 16-wide and metadata resolution 64-wide by default (tunable via the
`DEP_CONCURRENCY` and `DEP_RESOLVE_CONCURRENCY` environment variables; an
explicit `DEP_CONCURRENCY` throttles both).

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
