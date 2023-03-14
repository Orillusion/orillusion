
![Cover Art](https://github.com/Orillusion/orillusion-webgpu-samples/blob/main/logo.png)     
       
> **Note:**
> 
> Currently, this repo is used to collect feedback on the NPM package of the Orillusion engine. According to all the feedback, we will carry on refining the engine core. Then, we need to set up the regulations for a long-term open source project and all the source code will be put in this repo in the near future, which indicates a brand new journey for Orillusion.      
  

## Orillusion
`Orillusion`  is a pure Web3D rendering engine that are fully developed based on the `WebGPU` standard. It aims to achieve desktop-level rendering effects and supports 3D rendering of complex scenes in the browser.

## Need to know
Beta version,  **NOT**  recommended for any commercial application.

## Install

### NPM
We recommend using front-end build tools for developing Web3D applications, such  [Vite](https://vitejs.dev/) or [Webpack](https://webpack.js.org/).

- Install dependencies:
```text
npm  install  @orillusion/core  --save
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
In order to use the engine more conveniently, we support to use `<script>` tag to import `Orillusion`. Three different ways to import using the official `CDN` link:
- **Globally:**  the object `window` in the `HTML` page will be embedded a variable called `Orillusion` which could be used directly
```html
<script src="https://cdn.orillusion.com/orillusion.umd.js"></script>
<script>  
    const { Engine3D, Camera3D } = Orillusion  
</script>
```
-  **ESModule:** we recommend using the [ESModule](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules) way for development. As most browsers have supported `ES` module, we just need to import the build version of `orillusion.es.js` ( following the `ESNext` standard )
```html
<script  type="module">  
    import { Engine3D, Camera3D } from "https://cdn.orillusion.com/orillusion.es.js" 
</script>
```
&#8195;&#8195;Due to the tag of `<script type="module">`, we could use the module syntax like `import` and `export`. With the help of  `vite` or `webpack`, we could import `CDN` link in the code directly
	
```javascript
import { Engine3D, Camera3D } from "https://cdn.orillusion.com/orillusion.es.js"
```
- **Import Maps:** in order to manage the name of dependencies, we recommend using [Import Maps](https://caniuse.com/import-maps)

```html
<!-- Define the name or address of ES Module -->  
<script  type="importmap">  
{  
    "imports": { "@orillusion/core": "https://cdn.orillusion.com/orillusion.es.js" }  
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
In default, `Engine3D.init()`will create a `canvas`  the same size with the window. Also, we could create a `canvas` manually using tag `<canvas>` with a `id`

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

## Platform
**Chrome Canary: 113**

> *As WebGPU is not released, please open `chrome://flags/#enable-unsafe-webgpu`, and enable the flag*

## Useful links
- [Official Web Site](https://www.orillusion.com/)
- [Documentation](https://www.orillusion.com/)
- [Forum](https://forum.orillusion.com/)

## License 

Orillusion engine is released under the [MIT](https://opensource.org/licenses/MIT) license. 
