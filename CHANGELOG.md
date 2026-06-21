# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.2](https://github.com/depjs/dep/compare/v1.4.1...v1.4.2) (2026-06-21)

### [1.4.1](https://github.com/depjs/dep/compare/v1.4.0...v1.4.1) (2026-06-21)


### Bug Fixes

* disable update check in CI and run its child from a stable cwd ([20c5f90](https://github.com/depjs/dep/commit/20c5f9052644932c045197c10315dc71b9108d3e))

## [1.4.0](https://github.com/depjs/dep/compare/v1.3.0...v1.4.0) (2026-06-21)


### Features

* fully support optionalDependencies (transitive, platform-aware, fault-tolerant) ([e224cb0](https://github.com/depjs/dep/commit/e224cb008043e70ea25eaf57cfbe1d9414ce767e))
* improve npm compat ([9dcadd7](https://github.com/depjs/dep/commit/9dcadd7ce69cf7f4e6930bb5851cc3d48ce508cf))
* support overrides and alias ([eb37e29](https://github.com/depjs/dep/commit/eb37e29f2632c8d30982889af47ae36658901d81))
* support prepare ([dbf740e](https://github.com/depjs/dep/commit/dbf740e474502e5d1a78ec7f87dcf43dced46839))

## [1.3.0](https://github.com/depjs/dep/compare/v1.2.0...v1.3.0) (2026-06-21)

### Features

* workspaces support, bounded concurrency, deterministic resolution ([879e6e9](https://github.com/depjs/dep/commit/879e6e9d49df2b203550319ee7ffd9a822f059be))

## [1.2.0](https://github.com/depjs/dep/compare/v1.1.0...v1.2.0) (2026-06-20)

### Features

* add workspaces, bounded concurrency, and deterministic resolution ([625f1f5](https://github.com/depjs/dep/commit/625f1f57ba72d584cf3978e555e2b901c3fb412d))

## [1.1.0](https://github.com/depjs/dep/compare/v1.0.0...v1.1.0) (2026-06-20)

### Features

* improve install algo ([#91](https://github.com/depjs/dep/issues/91)) ([8f3f713](https://github.com/depjs/dep/commit/8f3f7134f33ad0c4b92f0faf8251b195b3bfcf2a))

## [1.0.0](https://github.com/depjs/dep/compare/v0.18.3...v1.0.0) (2026-06-20)

## [0.18.3](https://github.com/depjs/dep/compare/v0.18.2...v0.18.3) (2020-09-16)

### Features

* integrate lock ([c0e4eba](https://github.com/depjs/dep/commit/c0e4ebae1ddb81a73ddd4a26931588ac562e8750))

## [0.18.2](https://github.com/depjs/dep/compare/v0.18.1...v0.18.2) (2019-12-09)

### Bug Fixes

* update supported node version ([ceec064](https://github.com/depjs/dep/commit/ceec064f5a151eb653ef9a4afdd82e523141bf8c))

## [0.18.1](https://github.com/depjs/dep/compare/v0.18.0...v0.18.1) (2018-05-20)

### Bug Fixes

* add Node.js v8 ([7cf42a8](https://github.com/depjs/dep/commit/7cf42a8b7bf6dc4e0d7654183f7793d4ff1ae7fb))
* do not suppose semver on registry ([d0125d5](https://github.com/depjs/dep/commit/d0125d50b92238a4d914e6a0b92d2e76489a2574))
* drop v4 and support v10 ([57da2d3](https://github.com/depjs/dep/commit/57da2d332f849add0b858f9aa34c5a59ea6993f7))
* lock is not ready yet ([ab5848a](https://github.com/depjs/dep/commit/ab5848a4418fc6bb67a89c4f089f7d8d35457f9e))

## [0.18.0](https://github.com/depjs/dep/compare/v0.17.1...v0.18.0) (2018-02-25)

### Features

* drop dat supports ([b5b0a76](https://github.com/depjs/dep/commit/b5b0a7624c61b9e9b9ce6f81aa6a7a02fc602973))

## [0.17.1](https://github.com/depjs/dep/compare/v0.17.0...v0.17.1) (2017-10-27)

### Bug Fixes

* **deps:** update tar-fs ([fdd4146](https://github.com/depjs/dep/commit/fdd4146a0c562eaf0601b0af43f888c7fa74434b))

## [0.17.0](https://github.com/depjs/dep/compare/v0.16.1...v0.17.0) (2017-09-26)

### Features

* **install:** support git submodule ([1d410f4](https://github.com/depjs/dep/commit/1d410f4cf9382a9c50f41f619cbeb97292e0cc51))

### Bug Fixes

* **deps:** add missing node-gyp files ([8325654](https://github.com/depjs/dep/commit/83256547aded7bc82dc4fe5b822b7e8d7e70f783))
* **install:** use `--quiet` in git processes ([bbdf942](https://github.com/depjs/dep/commit/bbdf9426d3fdd93bd8b5779b2369b3acf430715f))

## [0.16.1](https://github.com/depjs/dep/compare/v0.16.0...v0.16.1) (2017-09-17)

### Bug Fixes

* **install:** fix to drop privilege ([3f57f04](https://github.com/depjs/dep/commit/3f57f0441260aa26e9b4cbda1836d4612c9bcb4f))
* **test:** add `t.end` at 01 test ([958ea3e](https://github.com/depjs/dep/commit/958ea3ee546a51d9a7139b44d1ef2d406acd55f2))
* **test:** add a test for native-module ([01f44a5](https://github.com/depjs/dep/commit/01f44a5182e3da4bbfee564e9cf5d01865e54e01))
* **test:** fix lint errors ([732ccfd](https://github.com/depjs/dep/commit/732ccfdad23aa656e69e9f009962e119f430b240))
* **test:** remove debug log ([49d57c4](https://github.com/depjs/dep/commit/49d57c4689bc296bc640e3259b28b2e04a918fac))
* **test:** update the permision of nyc ([7a736b1](https://github.com/depjs/dep/commit/7a736b12d51a1e8ff79438aa9fb4b21143b1f515))
* **test:** use exec for Windows ([5f75b3e](https://github.com/depjs/dep/commit/5f75b3e55662abbfa1731e801e3e7a939f93a75b))
* **test:** use execFile ([f9ccb47](https://github.com/depjs/dep/commit/f9ccb47cf95886a33df317005c578f9b7f5e5a8c))
* **test:** use root user at ci ([e3ef948](https://github.com/depjs/dep/commit/e3ef948bee0d3b5595e3248459abb2a4208f6d3d))

## [0.16.0](https://github.com/depjs/dep/compare/v0.15.0...v0.16.0) (2017-09-13)

### Features

* **meta:** transfer the repository to an org ([4dcb286](https://github.com/depjs/dep/commit/4dcb286146f4b110ab6dca4051820aeb8cf84c12))

### Bug Fixes

* **deps:** remove is-root ([da453d0](https://github.com/depjs/dep/commit/da453d09d9bccfef6ff6b0b2fbeb7e83e1d1fd5b))
* **deps:** remove reuqire-directory ([d2c8db2](https://github.com/depjs/dep/commit/d2c8db2ba82fd8c58f697b67dc57ff00d568831c))
* **install:** install path directly ([b1a71ee](https://github.com/depjs/dep/commit/b1a71eea8da7a3813a9aaf8dcd1378bb3e95b3ae))
* **install:** path is already resolved by fetchSpec ([4e7aae1](https://github.com/depjs/dep/commit/4e7aae1edcefd7ff6c3568abaea1fad9b79fa8e8))
* **install:** update the switch in saver ([efd88b9](https://github.com/depjs/dep/commit/efd88b9128f618244bf6c24ce06acd1a2073ed77))
* **test:** add timeout to test cmd ([b6ffc36](https://github.com/depjs/dep/commit/b6ffc367c343b91962b34aa3f063a2dbef302bb3))
* **test:** rm `.dat` dir after testing ([7952355](https://github.com/depjs/dep/commit/7952355acb9b1bb5c4ee56953e8e5d72f3d3595c))
* **test:** save the file deps in tests ([ff05b3f](https://github.com/depjs/dep/commit/ff05b3f5071a451172608307573b3f1acc1f1b95))
* **test:** update directory tree in tests ([1b42853](https://github.com/depjs/dep/commit/1b42853e48bbebc0be0f51fe12f90a0edd3e6007))

## [0.15.0](https://github.com/depjs/dep/compare/v0.14.6...v0.15.0) (2017-09-09)

### Features

* **install:** display deprecated message ([eb9eced](https://github.com/depjs/dep/commit/eb9ecedf854b6b2b58f50bbce30529bcf0e259e1))

### Bug Fixes

* **test:** add test for the deprecated message ([633e457](https://github.com/depjs/dep/commit/633e45708c7685e5b82f2be3df04b991e9a757be))

## [0.14.6](https://github.com/depjs/dep/compare/v0.14.5...v0.14.6) (2017-09-09)

### Bug Fixes

* **install:** change the permission of bin file ([17f3fb6](https://github.com/depjs/dep/commit/17f3fb63e4ad0d9eb92b2249c814a3c5b489b083))

## [0.14.5](https://github.com/depjs/dep/compare/v0.14.4...v0.14.5) (2017-09-08)

### Bug Fixes

* **run:** update the defualt value of the cwd ([b64c200](https://github.com/depjs/dep/commit/b64c200964234d58ee72dde8f5f76268477738ee))

## [0.14.4](https://github.com/depjs/dep/compare/v0.14.3...v0.14.4) (2017-09-08)

### Bug Fixes

* **install:** passing the right cwd to the runner ([df8009d](https://github.com/depjs/dep/commit/df8009d7b9dfdfac5cb220d41d2ab59b343585f8))

## [0.14.3](https://github.com/depjs/dep/compare/v0.14.2...v0.14.3) (2017-09-06)

### Bug Fixes

* **deps:** remove coveralls and nyc ([a0a7103](https://github.com/depjs/dep/commit/a0a7103e00bbcc99c6a0fed4052bef86f871faca))
* **deps:** stop using rimraf ([89252d8](https://github.com/depjs/dep/commit/89252d8a9b5cac78f3169ad0e88990f24dac4031))
* **gitignore:** ignore mkdirp ([2375194](https://github.com/depjs/dep/commit/23751941137d95da21ce6a7ba1fc060704c83282))
* **install:** update removing file at dat fetcher ([e8ad5b9](https://github.com/depjs/dep/commit/e8ad5b9366f7b0d9efff2f72cf8e8f71f937ff8a))
* **refactor:** stop using mkdirp ([53400c6](https://github.com/depjs/dep/commit/53400c6228a880a22f68b50986305bf49c2d5d2f))
* **test:** add tests for dat dependency ([2391142](https://github.com/depjs/dep/commit/239114228a5d39784f1eb4b1ad4b13e4fd6e3a41))
* **test:** fix coverage settings ([f0efd42](https://github.com/depjs/dep/commit/f0efd429a4526f000979196aeaf52e9631c8caa8))
* **travis:** use the env at travis ([dd9c2cf](https://github.com/depjs/dep/commit/dd9c2cf32bab3ae0f3ba4733991252f5b6a7fba0))

## [0.14.2](https://github.com/depjs/dep/compare/v0.14.1...v0.14.2) (2017-08-31)

### Bug Fixes

* **install:** escape the name of scoped packages ([6dad6e7](https://github.com/depjs/dep/commit/6dad6e71f6c221be0c5733950769c8c12f23c5e3))
* **install:** tree setter should handle scoped package ([e10a011](https://github.com/depjs/dep/commit/e10a011066206d49ab8c35fa598de8c68c89d6aa))
* **lock:** support scoped packages ([18f6557](https://github.com/depjs/dep/commit/18f6557360f63b230d3c75d551ffaa4c7f2184c5))
* **test:** skip mac on the ci for a while ([48e919e](https://github.com/depjs/dep/commit/48e919e38d2d2421956db5a200c1b6d8c854fa5b))

## [0.14.1](https://github.com/depjs/dep/compare/v0.14.0...v0.14.1) (2017-08-27)

### Bug Fixes

* **install:** read package.json in the method ([a94dbe8](https://github.com/depjs/dep/commit/a94dbe85e88f07b4435a99a2979174846c554690))

## [0.14.0](https://github.com/depjs/dep/compare/v0.13.6...v0.14.0) (2017-08-25)

### Features

* **install:** drop privileges instead of exit ([2a81a03](https://github.com/depjs/dep/commit/2a81a036cb6f8189e8d19c163285c3d43a06b7ac))

### Bug Fixes

* **install:** add error handling to installer ([bbfd4b8](https://github.com/depjs/dep/commit/bbfd4b82cf8000bd692c9be847ad06e033584605))
* **install:** grammer fix ([e4028fc](https://github.com/depjs/dep/commit/e4028fcc6840af070ba8fda83af20d6949a66fdc))
* **utils:** exit when couldn't drop privilege ([bbc4190](https://github.com/depjs/dep/commit/bbc4190d8a4b345d5844fa178e2b09b47ed0978e))

## [0.13.6](https://github.com/depjs/dep/compare/v0.13.5...v0.13.6) (2017-08-19)

### Bug Fixes

* **dep:** make dat-node optional ([a2cba8a](https://github.com/depjs/dep/commit/a2cba8a2f54dc67a14d3741cae78d0d51a32fdd3))

## [0.13.5](https://github.com/depjs/dep/compare/v0.13.4...v0.13.5) (2017-08-19)

### Bug Fixes

* **install:** fix dat util ([36f14c6](https://github.com/depjs/dep/commit/36f14c6d31cc1532dcf71d1953c45ea538475d03))
* **test:** fix lint errors ([da93efa](https://github.com/depjs/dep/commit/da93efa7ad5f885ffd1542b0b20cdcd7144a0a32))

## [0.13.4](https://github.com/depjs/dep/compare/v0.13.3...v0.13.4) (2017-08-19)

### Bug Fixes

* **install:** fix dat install logic ([76e3281](https://github.com/depjs/dep/commit/76e3281bb6c360cf56019c9efcd64d2f2fac40ba))
* **install:** fix dat install process ([5a630bb](https://github.com/depjs/dep/commit/5a630bb8226846eb12f86a823afddb355031c260))

## [0.13.3](https://github.com/depjs/dep/compare/v0.13.2...v0.13.3) (2017-08-15)

### Bug Fixes

* **test:** add test for install --only ([5580fe6](https://github.com/depjs/dep/commit/5580fe682b116fcde958f1d2b2c601facc8f2f25))
* **test:** fix lint errors ([5ace741](https://github.com/depjs/dep/commit/5ace741a72078c4ce964e17a5bd4ce433963dc85))

## [0.13.2](https://github.com/depjs/dep/compare/v0.13.1...v0.13.2) (2017-08-12)

### Bug Fixes

* **install:** mkdirp node_modules/.bin ([bdfb743](https://github.com/depjs/dep/commit/bdfb743d1053023b454b2f82cbabda88325164a3))
* **test:** add test for `install --save` ([679b21b](https://github.com/depjs/dep/commit/679b21b08e6878bf8d75a6bd5c03341bc03a43b1))
* **test:** fix lint errors ([69acbd0](https://github.com/depjs/dep/commit/69acbd023afa593aa960f333b8c1913a41296771))

## [0.13.1](https://github.com/depjs/dep/compare/v0.13.0...v0.13.1) (2017-08-10)

### Bug Fixes

* **bin:** add `depjs` alias ([5e8c905](https://github.com/depjs/dep/commit/5e8c9058d46d9f09f323ac355c93470e9f505bc6))

## [0.13.0](https://github.com/depjs/dep/compare/v0.12.0...v0.13.0) (2017-08-09)

### Features

* **install:** add install --save=dev|prod ([170bcf8](https://github.com/depjs/dep/commit/170bcf8c22cc52fd9267f1b9224321a1a255a3df))

### Bug Fixes

* **test:** fix lint errors ([81f3fa5](https://github.com/depjs/dep/commit/81f3fa522602e573b7141ebcab8fd5127a6a353e))

## [0.12.0](https://github.com/depjs/dep/compare/v0.11.0...v0.12.0) (2017-08-07)

### Features

* **install:** support install <pkg> ([4601b84](https://github.com/depjs/dep/commit/4601b84e301adba63437c014e35f016f7884798a))

## [0.11.0](https://github.com/depjs/dep/compare/v0.10.3...v0.11.0) (2017-08-07)

### Features

* **install:** add --only option ([caba701](https://github.com/depjs/dep/commit/caba70198ad589912efbe5d4b3950d0666e746b9))

### Bug Fixes

* **scripts:** use --only option ([2c49f00](https://github.com/depjs/dep/commit/2c49f0074032546533ea5c8c536fd202a4108c09))

## [0.10.3](https://github.com/depjs/dep/compare/v0.10.2...v0.10.3) (2017-08-06)

### Bug Fixes

* **dep:** add .npmignore ([b4bcd03](https://github.com/depjs/dep/commit/b4bcd031b1293c46bd477a6ee0847ee0a14225bf))
* **dep:** add bundleDependencies ([f4b592e](https://github.com/depjs/dep/commit/f4b592ef3c30e3cd9e2aa7d27e4e4b45c774f5ec))
* **dep:** add dat-node ([8c68afb](https://github.com/depjs/dep/commit/8c68afb777f6d89bbf723fdf54fdd79571be7ada))
* **dep:** add unbuild modules to dat-node ([23c405d](https://github.com/depjs/dep/commit/23c405d7963ef0694785c49d4d00504a34ad5b28))
* **dep:** ignore node_modules in dat-node ([ef25188](https://github.com/depjs/dep/commit/ef25188675fffafb6bc8641a59cb35ce8414162c))
* **dep:** make dat-node optional ([fb1bc71](https://github.com/depjs/dep/commit/fb1bc71ccf2cd4a946bc3cbdc0cef818db2f720b))
* **dep:** put bundleDependencies ([90163ff](https://github.com/depjs/dep/commit/90163ff89914cf15c8112cd1b86c607df18799c2))
* **dep:** remove bundle deps of dat-node ([9dd0675](https://github.com/depjs/dep/commit/9dd0675d6ce86360c30946a0b84e1b217dd7e290))
* **dep:** update dat version ([22c6722](https://github.com/depjs/dep/commit/22c6722cfb052ebbb63a9f7aca36befe1b7442d6))
* **dep:** update dat-node files ([130e879](https://github.com/depjs/dep/commit/130e879c517ad5a8425bf3b878c1eb164104baea))
* **dep:** update standard version ([51481ac](https://github.com/depjs/dep/commit/51481acce9aea774cca1889efd9b327a5566350d))
* **gitignore:** put bundleDependencies ([638dd6e](https://github.com/depjs/dep/commit/638dd6eede297af3248dc75202d3c30a0b44b8dc))
* **gitignore:** tweak the scope of dat-node ([a76904e](https://github.com/depjs/dep/commit/a76904e53d2406016a3c6e2c82f5ff9c514742aa))
* **install:** add dat fixture ([35a88f6](https://github.com/depjs/dep/commit/35a88f6a1786d4b6b7c9066cbefd000e4ad49252))
* **install:** fix rimraf call ([c2e4b00](https://github.com/depjs/dep/commit/c2e4b0087f40fc4c02e527c2b50613083710e0ee))
* **install:** fix the path of node-gyp ([5fe9988](https://github.com/depjs/dep/commit/5fe99884a1e554f36e6e451fb89b374d37ad67af))
* **install:** replace the path of node-gyp ([e7cbe95](https://github.com/depjs/dep/commit/e7cbe9558b7bed3eaa3cce0d263899a0f831e186))
* **refactor:** use arrow function ([88f67cb](https://github.com/depjs/dep/commit/88f67cb8059513c9008ba6d502a037e18850c597))
* **scirpts:** update install build process ([bfa004e](https://github.com/depjs/dep/commit/bfa004ebad5446ccdfd8c0d83a1a6593460018fb))
* **script:** add stand alone install/uninstall script ([fb1cdcc](https://github.com/depjs/dep/commit/fb1cdccf3d97cd1f5be4e49d160a3f6d8b6bc028))
* **script:** fix uninstall/install scripts ([16ba314](https://github.com/depjs/dep/commit/16ba31485e1d6976d82dc53de786a2e372967488))
* **scripts:** add handling dat-node ([dc16b74](https://github.com/depjs/dep/commit/dc16b7427d8df2816de8340f497a4f50611bec0e))
* **scripts:** add native build processes to install script ([cf13f4b](https://github.com/depjs/dep/commit/cf13f4b2e5cdb03fc183c47c6cf26445fcb5f40f))
* **scripts:** change the order to install nodeGyp ([90f82c0](https://github.com/depjs/dep/commit/90f82c0583fa91d6e87fd0804bbf3a03d4a5a03b))
* **scripts:** fix lint errors in the install script ([e9306e6](https://github.com/depjs/dep/commit/e9306e6e9cabfb43983b949838026dc202d15845))
* **scripts:** fix the install script to make a symlink ([ea50cdc](https://github.com/depjs/dep/commit/ea50cdc18edb862a41d1a764044bca93e1956801))
* **scripts:** improve the logs ([5a1b218](https://github.com/depjs/dep/commit/5a1b21810bdd07fed36e678246d51bd44bb2b59b))
* **test:** check scripts and fix lint errors ([91b30eb](https://github.com/depjs/dep/commit/91b30eb35b8a4bdc265efdcd96067e8a7db7d651))
* **util:** change node-gyp path ([f447d44](https://github.com/depjs/dep/commit/f447d446dabc6830c020d8b32a7937e5c185ace6))

## [0.10.2](https://github.com/depjs/dep/compare/v0.10.1...v0.10.2) (2017-08-03)

### Bug Fixes

* **dep:** downgrade cross-spawn version because of a regression ([0f59e46](https://github.com/depjs/dep/commit/0f59e46cc276f7355c555b5dcc6bc5f765eae31c))
* **dep:** uninstall --save cross-spawn ([82ebdbd](https://github.com/depjs/dep/commit/82ebdbd4f5f33e9ff9e0a416fa9a43ca7e79eda1))
* **dep:** upgrade cross-spawn version because of a regression ([74e8fa3](https://github.com/depjs/dep/commit/74e8fa3b1595b2a77e9fb956ba7c050c344f66c8))
* **run:** detached is flase on win32 ([4010a60](https://github.com/depjs/dep/commit/4010a600e58c9654ecf3ba858931ee03f396e85d))
* **run:** shell is false on win32 ([8a14105](https://github.com/depjs/dep/commit/8a141054c8c5ccd95793a74d728657de880b09a3))
* **run:** use {shell: true} ([a5706ce](https://github.com/depjs/dep/commit/a5706cedf6da91d65d84240bb5bf7953bd79452f))
* **test:** fix lint errors ([e2a6236](https://github.com/depjs/dep/commit/e2a62361d691170181a4229567571f2de99bc147))

## [0.10.1](https://github.com/depjs/dep/compare/v0.10.0...v0.10.1) (2017-08-03)

### Bug Fixes

* **install:** fix process.stderr ([1bbd3ad](https://github.com/depjs/dep/commit/1bbd3adef444b0108aee02beb778a4ba9d0c107c))
* **install:** rm node_modules when install starts ([c845e5a](https://github.com/depjs/dep/commit/c845e5a102298b4ef942493d0a5e5e0149bf4a2c))
* **meta:** add a meta keyword to package.json ([6187674](https://github.com/depjs/dep/commit/6187674220ba2b134980ae58d6f2e16773167f4c))
* **refactor:** replace console.error with process.stderr ([ad5df92](https://github.com/depjs/dep/commit/ad5df92a506970802cf9c974b496d17762142ce1))
* **run:** support multiple commands ([0e5b51d](https://github.com/depjs/dep/commit/0e5b51d6995bd0537620a370edfd1de2d20b7c20))
* **test:** add double quotes to wrap file names ([6be34e2](https://github.com/depjs/dep/commit/6be34e233503443820c3405b22de6a28172b6e32))
* **test:** fix lint errors ([e2443ad](https://github.com/depjs/dep/commit/e2443ad16a36c4ae8ae4bf6cca487392311d4ab5))

## [0.10.0](https://github.com/depjs/dep/compare/v0.9.1...v0.10.0) (2017-08-02)

### Features

* **install:** support install scripts ([6f8bd84](https://github.com/depjs/dep/commit/6f8bd847469d11c236705712a488c9ef585540bc))

### Bug Fixes

* **dep:** install --save is-root ([1e08875](https://github.com/depjs/dep/commit/1e08875488ed5bae6a7ce182c606e5c4f396d516))
* **install:** does not allow root users to run lifecycle scripts ([d38ac94](https://github.com/depjs/dep/commit/d38ac945502e5a0fc4867b4e872d8176889e5874))
* **install:** fix installer if the lifecycle is empty ([0bc7d59](https://github.com/depjs/dep/commit/0bc7d597372349cb47ae5b252c27299c90c1b7c7))
* **install:** minor tweak to the log message ([9287673](https://github.com/depjs/dep/commit/9287673a7cdc9f2a57297cf9d69a647d4dc559f3))

## [0.9.1](https://github.com/depjs/dep/compare/v0.9.0...v0.9.1) (2017-08-02)

### Bug Fixes

* **refactor:** remove debug comment ([edaffdf](https://github.com/depjs/dep/commit/edaffdf304712eb42163f052c2bf37d4caced87f))

## [0.9.0](https://github.com/depjs/dep/compare/v0.8.0...v0.9.0) (2017-08-02)

### Features

* **run:** support pre/post script ([656d70d](https://github.com/depjs/dep/commit/656d70d7c0b9740c8a8f7ad41afa893e37fc0e61))

### Bug Fixes

* **dep:** install --save promise-each ([218d67e](https://github.com/depjs/dep/commit/218d67ebaec5782201e86f63a07e47a4dc7531ee))
* **install:** remove tmp file when resolver is finished ([ca50e62](https://github.com/depjs/dep/commit/ca50e62a2d1959f05281c2729c82e3a1094836ef))
* **test:** add a test for pre/post script ([bab58b5](https://github.com/depjs/dep/commit/bab58b51f417c75153481f46cbc096fc1f4b311b))
* **test:** fix lint errors ([2447b47](https://github.com/depjs/dep/commit/2447b4755ee2e32eb74064fd82336ce5dab46ff2))

## [0.8.0](https://github.com/depjs/dep/compare/v0.7.1...v0.8.0) (2017-08-01)

### Features

* **dat:** support dat dependency as an experimental feature ([7001781](https://github.com/depjs/dep/commit/700178121241e0895a4b5760133dbbd5ea946e15))

### Bug Fixes

* **dep:** install dat-node --save ([b2e0883](https://github.com/depjs/dep/commit/b2e08833c580c7fe59b934cabbb6eab0d0f48ff2))
* **dep:** update fs-extra to 4.0.1 ([4b4bc9e](https://github.com/depjs/dep/commit/4b4bc9e124d9066e52d8bb2804477e10e7ce68ec))
* **dep:** update which to 1.3.0 ([932ad96](https://github.com/depjs/dep/commit/932ad96da961e4214c97b739897c53ca2b382668))

## [0.7.1](https://github.com/depjs/dep/compare/v0.7.0...v0.7.1) (2017-07-31)

### Bug Fixes

* **install:** fix the logic to get the hash at git resolver ([e2ceb04](https://github.com/depjs/dep/commit/e2ceb0491b0c49b06478932182cd9b74cbedc713))

## [0.7.0](https://github.com/depjs/dep/compare/v0.6.1...v0.7.0) (2017-07-31)

### Features

* **notifier:** add update-notifier ([1ba0023](https://github.com/depjs/dep/commit/1ba0023fb56b67bdb4beacada81ac274fe5ae097))

### Bug Fixes

* **dep:** install update-notifier --save ([a0b0259](https://github.com/depjs/dep/commit/a0b02595ba53fda6f2a40af03f9837eb4c32eee3))
* **resolver:** use fetchSpec to follow npm ([12b2c68](https://github.com/depjs/dep/commit/12b2c68f08e43c5335390d2567b0ef97146d8cd5))

## [0.6.1](https://github.com/depjs/dep/compare/v0.6.0...v0.6.1) (2017-07-30)

### Bug Fixes

* **dep:** use rimraf ([116bdcc](https://github.com/depjs/dep/commit/116bdccec91911fad852729b7ec8bdf39694feeb))
* **ux:** display log about what dep is doing ([f1ec072](https://github.com/depjs/dep/commit/f1ec0724b2f73c9e1066b8ba1c32ee186a5dea40))

## [0.6.0](https://github.com/depjs/dep/compare/v0.5.2...v0.6.0) (2017-07-30)

### Features

* **run:** add `dep run` ([6cf3174](https://github.com/depjs/dep/commit/6cf3174d4bb3c730a58bb44836192e4be649bb4d))

### Bug Fixes

* **dep:** install --save cross-spawn ([caf560b](https://github.com/depjs/dep/commit/caf560bf2543ffffe9cde085ef9eb5110324af29))
* **dep:** install --save npm-path ([a4a9016](https://github.com/depjs/dep/commit/a4a9016977ef33da922f63f03005a1164548c014))
* **run:** exclude stderr ([b03fe83](https://github.com/depjs/dep/commit/b03fe835d6bedc174f9f88fbaa6b203d2ca4ed08))
* **run:** replace spawn with cross-spawn ([ce0fc62](https://github.com/depjs/dep/commit/ce0fc62dcd27f0d1ab3a2003a6faa37615a27076))
* **run:** use `process.env` as the context ([614e787](https://github.com/depjs/dep/commit/614e7873b9eb1f0dcdd1cd85f0c94b50e0d5223e))
* **test:** add double quotes ([d4236a8](https://github.com/depjs/dep/commit/d4236a8da3272f88eb7697b981a9324a6ec1df60))
* **test:** increase test coverage of run ([6a10926](https://github.com/depjs/dep/commit/6a10926f3354f81552625eb976a64ae8fbe4cac1))

## [0.5.2](https://github.com/depjs/dep/compare/v0.5.1...v0.5.2) (2017-07-29)

### Bug Fixes

* **dep:** add native-build package ([249b777](https://github.com/depjs/dep/commit/249b777f5ad50f6c0975d7dc131966e4e574ac55))
* **dep:** install --save-dev tap-spec ([7e93d42](https://github.com/depjs/dep/commit/7e93d4292a174c4ec488ea64ac5560cd9261a06f))
* **dep:** install nyc --save-dev ([87e7cb9](https://github.com/depjs/dep/commit/87e7cb946638017513c9025eb28d546f8da3ac4f))
* **dep:** uninstall istanbul ([7dce735](https://github.com/depjs/dep/commit/7dce735de8c223c14c29cd9d577dd3307932dd2b))
* **dep:** uninstall tape-spec ([f56f18f](https://github.com/depjs/dep/commit/f56f18f770ea30f443aa65e54f97e6deacbc369c))
* **dep:** use tap instead of tape and coverage ([78df61e](https://github.com/depjs/dep/commit/78df61e9b3792c65680cefda68cd64981086b54f))
* **gitignore:** no need to ignore build dir ([8d7dff8](https://github.com/depjs/dep/commit/8d7dff80fa4d844857b85d95ef4d9d320d320c7f))
* **lock:** use path.sep instead of `/` ([fe210a3](https://github.com/depjs/dep/commit/fe210a3e71b55e4bae418ad3505c6dfa612dfa7e))
* **refactor:** add catch to the main Promise ([c6a6e87](https://github.com/depjs/dep/commit/c6a6e8708c253cafd9f142e735a650efcfef0b98))
* **test:** add a quoted string ([0aa9b30](https://github.com/depjs/dep/commit/0aa9b305c43042338d21be88d3ada1db8127ed72))
* **test:** add a test for lock ([de8ecaa](https://github.com/depjs/dep/commit/de8ecaa95ba4ced436b8775337c948b7a9fee5be))
* **test:** add all type of deps ([e49a833](https://github.com/depjs/dep/commit/e49a8332be721816067ccd640e8f71d591d54928))
* **test:** add git tests and rename names ([c4396b1](https://github.com/depjs/dep/commit/c4396b188c0d71e04f34892d3c116a87779cf0db))
* **test:** add test to resolve complex tree ([6b404d5](https://github.com/depjs/dep/commit/6b404d53e65ea738a85a681c067c5455ea58e5e8))
* **test:** drop native build ([fadfa86](https://github.com/depjs/dep/commit/fadfa864c945805df884541a6e69556fdc2753f4))
* **test:** extracted path.sep is always `/` ([ca748d3](https://github.com/depjs/dep/commit/ca748d3003bd8983c1c6959028c0e1077349e284))
* **test:** fix test-ci script ([7e218d7](https://github.com/depjs/dep/commit/7e218d75fe4026ad990edf53d01d64ccc2c99a89))
* **test:** replace istanbul with nyc ([3d3779c](https://github.com/depjs/dep/commit/3d3779cd2f86c0ee1416795b2412e15d7a3c6315))
* **test:** replace single quotes with double ([5d49cfb](https://github.com/depjs/dep/commit/5d49cfb83eaffe976a8ddefa424bcb45db48ec35))
* **test:** test help and version ([fdd4277](https://github.com/depjs/dep/commit/fdd427753907e52522f9156e4795c205724895f8))
* **test:** test unhandled help ([7e6a238](https://github.com/depjs/dep/commit/7e6a23855edf95c0346cf674a45449536e807252))
* **test:** update help test ([ea9f596](https://github.com/depjs/dep/commit/ea9f59660f0817af5cbbcf122d8270251533c0d2))
* **travis:** add addons and env for node-gyp ([e1b3192](https://github.com/depjs/dep/commit/e1b31921f80fdf49236ad2e66071af83738405a7))
* **travis:** add env and addon to v4 ([3a45971](https://github.com/depjs/dep/commit/3a4597188d7213efe0399fb2443f3c35126d122e))
* **travis:** disable email notification ([e372291](https://github.com/depjs/dep/commit/e372291d722aedc344ed1b1135439faca254f064))
* **travis:** exclude osx for a while ([ed99f31](https://github.com/depjs/dep/commit/ed99f315b25d533dc34afbe068cfb18c5ec809f7))
* **travis:** get rid of addons on osx ([cbb227b](https://github.com/depjs/dep/commit/cbb227becab1dda4bc3cfaaadda860bea46c1d19))
* **travis:** run test-ci only on v6 ([1ea8682](https://github.com/depjs/dep/commit/1ea8682ccd778d58e52a4d3487b4270789561a3e))
* **travis:** use test-ci script ([557acc2](https://github.com/depjs/dep/commit/557acc2b4243ab4e9b35fcdbb915341cad20b91f))

## [0.5.1](https://github.com/depjs/dep/compare/v0.5.0...v0.5.1) (2017-07-27)

### Bug Fixes

* **dep:** install --save-dev rimraf ([d9118e9](https://github.com/depjs/dep/commit/d9118e9b008d8abc33743348c5bb5550569f6c90))
* **dep:** install --save-dev standard-version ([98b7900](https://github.com/depjs/dep/commit/98b7900c674c605b92b1624331e819c03fc6abfe))
* **dep:** install tape ([2946548](https://github.com/depjs/dep/commit/29465487882c56af032b29dca015be53a509ad52))
* **dep:** remove build scripts ([48207ee](https://github.com/depjs/dep/commit/48207ee3f06c5af9ecd8c1d5212caf75f0f2ff71))
* **dep:** uninstall ava ([396874c](https://github.com/depjs/dep/commit/396874ce9d3e074f20826ba3a701e4b5f998a04e))
* **dep:** update semver@5.4.1 from 5.3.0 ([e1b741d](https://github.com/depjs/dep/commit/e1b741d2aebe5e95db5a807efcea12381f2be1f1))
* **refactor:** add existsSync in npmrc ([4163485](https://github.com/depjs/dep/commit/416348568e47490fd456c90b9f51778eb4e477d2))
* **refactor:** make dep run on Node.js v4 ([ba9cfaf](https://github.com/depjs/dep/commit/ba9cfaf83137ee0f96f997dcc2c054b85591763a))
* **refactor:** replace PWD with process.cwd() ([b4ce500](https://github.com/depjs/dep/commit/b4ce500a3fa088af50b5ed1b4687b8c3b75fbe0e))
* **refactor:** stop using destructuring assignment ([97780f3](https://github.com/depjs/dep/commit/97780f398dbca3d3cf393ccfdf56530d1d6a6e94))
* **refactor:** use request instead of https module ([b606b4d](https://github.com/depjs/dep/commit/b606b4d41c2e563b17495946993fe6de64dff019))
* **test:** add .travis.yml ([937a08b](https://github.com/depjs/dep/commit/937a08b0daab1e48c97e73169de720101f972708))
* **test:** add appveyor.yml ([d1037d7](https://github.com/depjs/dep/commit/d1037d7d6db48a533312eff1346b0bebe4a0c464))
* **test:** cache node_modules in travis ([b5cecbc](https://github.com/depjs/dep/commit/b5cecbc9eee66db18ed574ac6288f7182de68eac))
* **test:** replace let with var ([d4308eb](https://github.com/depjs/dep/commit/d4308ebd9b5dd15147342d27504786766fad8eda))
* **test:** sudo should be false on ci ([0e52953](https://github.com/depjs/dep/commit/0e529539f839ee74b89f0fb85e43560454d57acb))
* **test:** support only active LTS versions ([8011d5d](https://github.com/depjs/dep/commit/8011d5da43449b9f6aac6773d4b6cb13f312e745))
* **test:** test on mac/linux with travis ([9cbbfd7](https://github.com/depjs/dep/commit/9cbbfd71c8c41b21f159d3ca437570d6095d10a5))

## [0.5.0](https://github.com/depjs/dep/compare/v0.4.1...v0.5.0) (2017-07-26)

## [0.4.1](https://github.com/depjs/dep/compare/v0.4.0...v0.4.1) (2017-07-25)

## [0.4.0](https://github.com/depjs/dep/compare/v0.3.0...v0.4.0) (2017-07-25)

## [0.3.0](https://github.com/depjs/dep/compare/v0.2.2...v0.3.0) (2017-07-24)

## [0.2.2](https://github.com/depjs/dep/compare/v0.2.1...v0.2.2) (2017-07-22)

## [0.2.1](https://github.com/depjs/dep/compare/v0.2.0...v0.2.1) (2017-07-19)

## [0.2.0](https://github.com/depjs/dep/compare/v0.1.0...v0.2.0) (2017-07-14)

## 0.1.0 (2017-06-20)
