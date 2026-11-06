A physically based atmospheric sky for [Orillusion](https://www.orillusion.com)

`@orillusion/atmosphere` provides a drop-in replacement for the core `AtmosphericComponent`. It exposes the same settings, but builds the sky from a Hillaire-style LUT chain (transmittance, multiple scattering and sky view) and adds an optional volumetric cloud layer. The core component uses a single-pass Chapman approximation, which is still available here through `showV1`.

## Usage
```bash
npm install @orillusion/core --save
npm install @orillusion/atmosphere --save
```
```ts
import { Engine3D, Scene3D } from "@orillusion/core"
import { AtmosphericComponent } from "@orillusion/atmosphere"

await Engine3D.init();
let scene = new Scene3D();

let sky = scene.addComponent(AtmosphericComponent);
sky.sunY = 0.6;
sky.enableClouds = true;
```

Or access Global build from CDN
```html
<script src="https://unpkg.com/@orillusion/core/dist/orillusion.umd.js"></script>
<script src="https://unpkg.com/@orillusion/atmosphere/dist/atmosphere.umd.js"></script>
```
```js
const { Engine3D, Scene3D } = Orillusion
const { AtmosphericComponent } = Orillusion.Atmosphere

await Engine3D.init();
let scene = new Scene3D();
scene.addComponent(AtmosphericComponent);
```

## Properties

The sky is re-baked on the next frame after any of these change.

| Property | Default | Description |
|---|---|---|
| `sunX` | `0.71` | Horizontal (azimuth) sun position, normalized `[0, 1]` |
| `sunY` | `0.56` | Vertical (elevation) sun position, normalized |
| `eyePos` | `1500` | Viewer altitude in meters |
| `sunRadius` | `500` | Angular size of the sun disc |
| `sunRadiance` | `11` | Radiance of the sun |
| `sunBrightness` | `1` | Overall brightness multiplier of the sun |
| `hdrExposure` | `2` | Exposure applied before the sky's tonemap / gamma step |
| `displaySun` | `true` | Draw the sun disc |
| `enableClouds` | `true` | Ray-march the volumetric cloud layer |
| `showV1` | `false` | Use the legacy Chapman-approximation sky instead of the LUT chain |
| `useAsEnvMap` | `true` | Also assign the sky as `scene.envMap` (IBL / reflections) |
| `relativeTransform` | — | Transform kept in sync with the sun direction (see below) |

## Sync the sun with a light

Assign a directional light's transform to `relativeTransform` to bind it to the sun in both directions. Rotating the light moves the sun, and changing `sunX` / `sunY` rotates the light.

```ts
import { DirectLight, Object3D } from "@orillusion/core"

let lightObj = new Object3D();
lightObj.addComponent(DirectLight);
scene.addChild(lightObj);

sky.relativeTransform = lightObj.transform;
```

## Environment map

By default the baked sky also becomes `scene.envMap`, so it lights PBR materials. Set `useAsEnvMap = false` to keep the visible sky dome without replacing the environment map. You can change it before `start()` or at runtime. When it is turned off at runtime, `scene.envMap` falls back to the engine's default sky.

```ts
sky.useAsEnvMap = false;
scene.envMap = myHDRTexture;
```

## LUT textures

The GPU sky is created on the component's first render, once the owning view and its `Context3D` are known. After that, `sky.atmosphericScatteringSky` (an `AtmosphericScatteringSky`, which extends `HDRTextureCube`) exposes the intermediate textures for debugging:

| Getter | Size | Content |
|---|---|---|
| `transmittanceLut` | 256 × 64 | Optical depth toward the sun |
| `multipleScatteringLut` | 32 × 32 | Multiple-scattering contribution |
| `skyViewLut` | 192 × 108 | Low-resolution distant sky |
| `cloudNoiseTexture` | 64 × 64 | Worley noise driving cloud density |
| `texture2D` | 1024 × 512 | Final equirectangular panorama projected onto the cube faces |

All LUTs are linear HDR (`rgba16float`). See [`samples/atmosphere/Sample_AtmosphericSky.ts`](../../samples/atmosphere/Sample_AtmosphericSky.ts) for a GUI-driven demo that displays every LUT next to the sky.

## Notes

- Add only one sky per scene. If you use a scene template that already installs the core `AtmosphericComponent`, disable it first.
- Every GPU resource is bound to the owning engine's `Context3D`, so the component works with multiple `Engine3D` instances.
- `SkyRenderer` is re-exported from `@orillusion/core` and is not a fork.

More doc from [Orillusion](https://www.orillusion.com/guide/graphics/skybox.html)
