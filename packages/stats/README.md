A simple performance monitor component for [Orillusion](https://www.orillusion.com)

## Usage
```bash
npm install @orillusion/core --save
npm install @orillusion/stats --save
```
```ts
import { Scene3D } from "@orillusion/core"
import { Stats } from "@orillusion/stats"

let scene = new Scene3D();
scene.addComponent(Stats);
```

Or access Global build from CDN
```html
<script src="https://unpkg.com/@orillusion/core/dist/orillusion.umd.js"></script>
<script src="https://unpkg.com/@orillusion/stats/dist/stats.umd.js"></script>
```
```js
const { Scene3D, Stats } = Orillusion 

let scene = new Scene3D();
scene.addComponent(Stats);
```

More doc from [Orillusion](https://www.orillusion.com/guide/performance/Readme.html)