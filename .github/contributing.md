# Orillusion Contributing Guide

Hi! I'm really excited that you are interested in contributing to Orillusion. Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
- [Write New Samples](#write-new-samples)
- [NPM Scripts](#scripts)
- [Project Structure](#project-structure)

## Issue Reporting Guidelines

- Welcome to use [Github](https://github.com/Orillusion/orillusion/issues)  to report a issues, request a feature, or ask a question

## Pull Request Guidelines

- Don't directly send PR to `main` branch, unless it's a urgent bug fix/patch.

- Checkout a feature branch from a dev based branch, e.g. `dev`, and merge back against that branch.

- [Make sure to tick the "Allow edits from maintainers" box](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/allowing-changes-to-a-pull-request-branch-created-from-a-fork). This allows us to directly make minor edits / refactors and saves a lot of time.

- If adding a new feature:

  - Add accompanying unit test or sample case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing a bug:

  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live sample/demo preferred.

- It's OK to have multiple small commits as you work on the PR - GitHub can automatically squash them before merging.

- Make sure CI tests pass!

- Commit messages must follow the [commit message convention](./commit-convention.md) so that changelogs can be automatically generated.

## Development Setup

[Node.js](https://nodejs.org) **version 16+**, and [PNPM](https://pnpm.io) **version 7+** is perferred.

First, you need to fork repo
Then, clone your forked repo

```bash
$ git clone git@github.com:XXX/orillusion.git
$ cd orillusion
$ git checkout dev # `dev` branch is perfered to start your development
```

If you need to run samples, you may need to init the `assets` submodule to load models, images and other resources:

```bash
$ git submodule update --init # init /public assets folder, it may take a long time due to large file size
```

After cloning the repo, run:

```bash
$ pnpm i # install all deps of the project
```

If you don't need electron/CI test in local, you can set `ELECTRON_SKIP_BINARY_DOWNLOAD` env to skip electron downloading process

```bash
$ ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm i # install deps without downloading electron binary
```

A high level overview of main tools used:

- [TypeScript](https://www.typescriptlang.org/) as the development language
- [Vite](https://vitejs.dev/) and [ESBuild](https://esbuild.github.io/) for development bundling
- [Rollup](https://rollupjs.org) for production bundling
- [Electron](https://www.electronjs.org/) for CI unit testing
- [TypeDoc](https://typedoc.org/) for API docs generating

## Write New Samples

1. create new entry `ts` in `/samples/xxx/Sample_xxx.ts`, the file name should be self-explanatory and start with `Sample_`. If there is no folder/category for your sample, create new one.

2. write your scene code, take [/samples/base/Sample_Transform.ts](../samples/base/Sample_Transform.ts) as a starter template/example. 

3. Coding rules:
    1. import core modules from `@orillusion/core`, e.g. `Engine3D, Scene3D, Object3D, ...`.
    2. import plugins/extentions from `@orillusion/xxx`, e.g. `@orillusion/stats, @orillusion/particle, @orillusion/physics...`.
    3. perfer using [Top-level await](https://v8.dev/features/top-level-await) to initialize the `Engine3D` and other async APIs.
    4. perfer embedding all `functions/classes/modules` into one single `ts` file.
    5. perfer using [dat.gui](https://github.com/dataarts/dat.gui) to control your scene parameters.
    6. write comments as much as possible to make your code more readable and self-documented.

4. If your sample requires local files, e.g. gltf models, images, we perfer you upload them to a public filehosting service, e.g. github pages, cloudflare CDNs, npmjs, AWS S3, Aliyun OSS, etc. Then use the public URLs to import them in your samples. Otherwise, you can add files to the `/public` folder and make PRs to our [assets](https://github.com/Orillusion/assets) repo so that you can import files directly from the `/` path.

## Scripts

### Start a Dev server
After install all dependenceies of the project, just run `pnpm run dev` to boot up a dev environment locally, with live relaod of the soure code.

```bash
$ pnpm run dev
```
After executing the above command, visit http://localhost:8000 and try live samples from `/samples`

### Build production libs
To build a production package:
```bash
$ pnpm run build
```
After executing the above command, the production libs (`orillusion.es.js` and `orillusion.umd.js`) will be generated in `dist` folder, along with all types `*.d.ts` in `dist/src` subfolder.

### Unit Test
To start an auto unit tests:
```bash
$ pnpm run test
```
This will start an electron window to run all tests in `test` folder. 

If you need to test in a docker/linux enviroment without GPU drivers:
```bash
$ pnpm run test:ci
```
This will force Electron to use a CPU based software Vulkan driver to process all tests with WebGPU APIs

### API docs
To generate API docs:
```bash
$ pnpm run docs # generate all docs, including core and packages
$ pnpm run docs:core # core docs only
```
All `md` docs will be generated in `docs` folder.

## Project Structure

A overview of project structure:

```bash
├─ 📂 node_modules/       # Dependencies
│  ├─ 📁 @webgpu          # WebGPU types for TS
│  └─ 📁 ...              # Other dependencies (TypeScript, Vite, etc.)
├─ 📂 src/                # @orillusion/core source
│  ├─ 📄 index.ts         # The entry root, export all modules from /src
│  └─ 📁 ...              # The core source files in sub category
├─ 📂 packages/           # @orillusion/xxx extensions
│  ├─ 📁 ammo             # Archive for Ammo.js
│  ├─ 📁 debug            # Internal debug lib based on dat.gui
│  ├─ 📁 draco            # Archive for draco_decoder.js
│  ├─ 📁 media-extention  # Media components for Orillusion
│  ├─ 📁 physics          # physics component for Orillusion, powerd by Ammo.js
│  └─ 📁 stats            # A simple performance stats component
│  └─ 📁 ...              # Others
├─ 📂 samples/            # Live samples
│  ├─ 📄 index.ts         # A entry mune to hold all samples in /samples
│  └─ 📁 ...              # Samples to test each sub category
├─ 📂 test/               # Unit tests
│  ├─ 📄 index.ts         # Entry mune to hold all tests in /test
│  ├─ 📄 util.ts          # test libs
│  ├─ 📁 ci               # main entry for electron
│  └─ 📁 ...              # Unit tests in each sub category
├─ 📄 .gitignore          # Ignore certain files in git repo
├─ 📄 index.html          # Dev index page
├─ 📄 LICENSE             # MIT
├─ 📄 package.json        # Node package file
├─ 📄 tsconfig.json       # TS configuration file
├─ 📄 vite.config.js      # vite configuration file
└─ 📄 README.md           # Read Me!
```

Welcome to submit PRs to extend `@orillusion` packages
