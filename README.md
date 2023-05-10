![Cover Art](https://github.com/Orillusion/orillusion-webgpu-samples/blob/main/logo_new.png)     
## Orillusion

[![Test](https://github.com/Orillusion/orillusion/actions/workflows/ci.yml/badge.svg)](https://github.com/Orillusion/orillusion/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@orillusion/core)](https://www.npmjs.com/package/@orillusion/core)

`Orillusion`  is a pure Web3D rendering engine which is fully developed based on the `WebGPU` standard. It aims to achieve desktop-level rendering effects and supports 3D rendering of complex scenes in the browser.

## Need to know
Beta version,  **NOT**  recommended for any commercial application.

## Install

### NPM
We recommend using front-end build tools for developing Web3D applications, such  [Vite](https://vitejs.dev/) or [Webpack](https://webpack.js.org/).

- Install dependencies:
```text
npm install @orillusion/core --save
```
- Import on-demand:
```javascript
import { Engine3D, Camera3D } from '@orillusion/core'
```
- Import globally:
```javascript
import * as Orillusion from '@orillusion/core'
```

### CDN
In order to use the engine more conveniently, we support to use native `<script>` tag to import `Orillusion`. Three different ways to import using the official `CDN` link:

- **Global Build:** You can use `Orillusion` directly from a CDN via a script tag:
```html
<script src="https://unpkg.com/@orillusion/core/dist/orillusion.umd.js"></script>
<script>  
    const { Engine3D, Camera3D } = Orillusion  
</script>
```
The above link loads the global build of `Orillusion`, where all top-level APIs are exposed as properties on the global `Orillusion` object.

-  **ESModule Build:** We recommend using the [ESModule](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules) way for development. As most browsers have supported `ES` module, we just need to import the `ES` build version of `orillusion.es.js`
```html
<script type="module">  
    import { Engine3D, Camera3D } from "https://unpkg.com/@orillusion/core/dist/orillusion.es.js" 
</script>
```

- **Import Maps:** In order to manage the name of dependencies, we recommend using [Import Maps](https://caniuse.com/import-maps)

```html
<!-- Define the name or address of ES Module -->  
<script  type="importmap">  
{  
    "imports": { "@orillusion/core": "https://unpkg.com/@orillusion/core/dist/orillusion.es.js" }  
}  
</script>  
<!-- Customerized names could be imported -->  
<script  type="module">  
    import { Engine3D, Camera3D } from "@orillusion/core"
</script>
```

## Usage
### Create Engine3D instance

At the beginning, we need to use `Engine3D.init()` and then the instance `Engine3D` will be created for further use

```javascript
import { Engine3D } from '@orillusion/core' 
Engine3D.init().then(()=>{  
    // Next
})
```
As `Engine3D.init()` is asynchronous, we recommend using `async/await` in the code
```javascript
import { Engine3D } from '@orillusion/core'  
async function demo(){  
    await Engine3D.init();  
    // Next 
}  
demo()
```
### Create canvas
In default, `Engine3D.init()`will create a `canvas` the same size with the window. Also, we could create a `canvas` manually using tag `<canvas>` with a `id`

```html
<canvas id="canvas" width="800" height="500" />
```
Next, we need to get the `<canvas>` via `id` and then init engine by passing the `<canvas>` to `canvasConfig`

```javascript
import { Engine3D } from '@orillusion/core';  
let canvas = document.getElementById('canvas')  

await Engine3D.init({  
    canvasConfig: { canvas }  
})
```
Please read the [Docs](https://www.orillusion.com/guide/) to Learn More.

## Platform
**Chrome Desktop: 113+**  
**Edge Desktop: 113+**

## Useful links
- [Official Web Site](https://www.orillusion.com/)
- [Documentation](https://www.orillusion.com/guide/)
- [Forum](https://forum.orillusion.com/)

## Dev and Contribution
Please make sure to read the [Contributing Guide](.github/contributing.md) before developing or making a pull request.

## License 

Orillusion engine is released under the [MIT](https://opensource.org/licenses/MIT) license. 
