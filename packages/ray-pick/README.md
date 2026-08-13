<a id="中文文档"></a>

# @orillusion/ray-pick

[中文](#中文文档) | [English](#english-documentation)

## 中文文档

`@orillusion/ray-pick` 为 Orillusion 场景提供可注入的 CPU 射线拾取能力。它会针对网格三角形进行射线检测，并作为独立包发布，因此无需修改 `@orillusion/core`。

### 功能特性

- 显式、可撤销的渲染器注入，导入包时不会产生副作用。
- 使用隔离且可复用的查询上下文，支持不同实例并行使用以及同一实例的嵌套查询。
- 支持场景或对象的递归拾取，结果按由近到远排序。
- 支持索引与非索引网格几何体。
- 支持世界变换、`near` / `far`、材质剔除、UV、法线、面索引和重心坐标。
- 内置支持 `MeshRenderer` 和 `SpriteRenderer`。
- 通过 `SceneRayPick` 提供标准 Orillusion `PICK_*` 指针事件。
- 可选支持 Graphic3D GPU 实例，且不会强依赖 `@orillusion/graphic`。

### 安装

将本包与兼容版本的 Orillusion Core 一起安装：

```bash
pnpm add @orillusion/core @orillusion/ray-pick
```

在本仓库中开发时，Vite 会直接将 `@orillusion/ray-pick` 解析到 `packages/ray-pick`。

### 基本用法

在发起射线查询前调用一次 `installRayPick()`。仅导入本包不会修改渲染器原型。

```ts
import {
    CameraUtil,
    Engine3D,
    Object3DUtil,
    Scene3D,
    Vector3,
    View3D,
} from '@orillusion/core';
import { installRayPick, Raycaster } from '@orillusion/ray-pick';

installRayPick();

const engine = await Engine3D.init();
const scene = new Scene3D();
const camera = CameraUtil.createCamera3DObject(scene, 'camera');
camera.perspective(60, engine.aspect, 0.1, 1000);
camera.lookAt(new Vector3(0, 5, 10), Vector3.ZERO, Vector3.Y_AXIS);

const cube = Object3DUtil.GetSingleCube(2, 2, 2, 0.3, 0.6, 1);
scene.addChild(cube);

const view = new View3D();
view.scene = scene;
view.camera = camera;
engine.startRenderView(view);

const raycaster = new Raycaster();
raycaster.setFromCamera(
    engine.inputSystem.mouseX,
    engine.inputSystem.mouseY,
    camera,
);

const hits = raycaster.intersectScene(scene);
const nearest = hits[0];
if (nearest) {
    console.log(nearest.object.name, nearest.point, nearest.distance);
}
```

传给 `setFromCamera()` 的屏幕坐标是 Canvas 像素坐标，与 `Camera3D.screenPointToRay()` 保持一致。

### 对象与场景查询

```ts
const raycaster = new Raycaster(ray, 0.1, 1000);

// 查询一个对象，默认包含其后代节点。
const objectHits = raycaster.intersectObject(object);

// 禁用后代节点遍历。
const directHits = raycaster.intersectObject(object, false);

// 查询多个根节点。
const groupHits = raycaster.intersectObjects([rootA, rootB]);

// 查询整个场景。
const sceneHits = raycaster.intersectScene(scene);
```

所有返回数组均按世界空间距离升序排列。由于每个相交的三角形都会产生一条记录，因此一条射线可能对同一个网格返回多个命中结果。

### 指针拾取事件

`SceneRayPick` 将本包的射线拾取器接入 Orillusion 输入系统。它会从控制器和命中的 `Object3D` 同时派发 `PICK_OVER`、`PICK_OUT`、`PICK_MOVE`、`PICK_DOWN`、`PICK_UP` 和 `PICK_CLICK`。

调用 `SceneRayPick.start()` 前，必须先启动对应的 `View3D`。

```ts
import { PointerEvent3D } from '@orillusion/core';
import { installRayPick, SceneRayPick } from '@orillusion/ray-pick';

installRayPick();

// 此前必须已经调用 engine.startRenderView(view)。
const scenePicker = new SceneRayPick(view).start();

scenePicker.addEventListener(
    PointerEvent3D.PICK_CLICK,
    (event: PointerEvent3D) => {
        const data = event.data as any;
        console.log('object:', event.target);
        console.log('position:', data.worldPos);
        console.log('face:', data.faceIndex);
        console.log('uv:', data.uv);
    },
    null,
);

// 对象级事件使用相同的事件数据。
cube.addEventListener(
    PointerEvent3D.PICK_OVER,
    () => console.log('pointer entered cube'),
    null,
);

// 暂停输入监听，但保留已注册的 PICK_* 监听器。
scenePicker.stop();

// 永久释放输入监听和 PICK_* 监听器。
scenePicker.destroy();
```

当 `engine.setting.pick.mode` 为 `ray` 时，`SceneRayPick` 才会处理输入。因为 `ray` 模式由此外部包提供，旧版 Core 的类型声明可能只有 `pixel | bound`，此时可使用窄范围类型转换：

```ts
const engine = await Engine3D.init({
    setting: {
        pick: {
            enable: true,
            mode: 'ray' as any,
        },
    },
});
```

如果应用只手动调用 `Raycaster`，则无需配置 Core 的拾取模式。

### Graphic3D 实例

Graphic3D 是可选依赖。请显式传入它的渲染器构造函数，使本包继续与 `@orillusion/graphic` 解耦：

```ts
import { Graphic3DMeshRenderer } from '@orillusion/graphic';
import {
    installGraphicRayPick,
    installRayPick,
} from '@orillusion/ray-pick';

installRayPick();
installGraphicRayPick(Graphic3DMeshRenderer);
```

每条结果标识具体的实例 `Object3D`，而不是共享渲染器的所有者。

### 命中结果

`RaycastHit` 包含以下字段：

| 字段 | 说明 |
| --- | --- |
| `distance` | 从射线原点到命中点的世界空间距离。 |
| `point` | 世界空间中的交点。 |
| `object` | 命中的 `Object3D`。 |
| `faceIndex` | 命中的三角形索引；Sprite 使用 `-1`。 |
| `face` | 三角形顶点索引和几何法线。 |
| `uv`, `uv1` | 存在对应属性时，通过重心坐标插值得到的纹理坐标。 |
| `normal` | 存在法线属性时，对象空间中的插值法线。 |
| `worldNormal` | 使用世界矩阵的逆转置矩阵变换后的插值法线。 |
| `barycoord` | 对应面顶点 `(a, b, c)` 的重心坐标权重。 |

`RaycastHit.worldNormal` 以及 `SceneRayPick` 事件中的 `worldNormal` 都位于世界空间；原始 `normal` 字段仍位于对象空间。

### 材质剔除

单材质网格按照该材质的 `cullMode` 执行射线检测：

- `back`：检测正面三角形。
- `front`：反转待检测三角形的绕序。
- `none`：检测三角形两面。

对于多材质网格，每个子几何体使用对应材质槽位，`face.materialIndex` 用于标识该槽位。与 `RenderNode` 一致，缺失的材质或子几何体会回退到槽位 `0`。

已禁用的渲染器、已禁用的材质以及天空渲染器会被忽略。

### 移除注入

`uninstallRayPick()` 会恢复 `installRayPick()` 和 `installGraphicRayPick()` 修改过的全部原型：

```ts
import { uninstallRayPick } from '@orillusion/ray-pick';

scenePicker.stop();
uninstallRayPick();
```

当其他视图仍依赖已注入的射线拾取功能时，请勿卸载。

### 完整示例与测试

- `samples/pick/Sample_RayPickPackage.ts` 展示完整场景、指针事件、Graphic3D 实例和命中调试可视化。
- `test/io/RayPickPackage.test.ts` 覆盖注入、场景遍历、排序、外部实例、多材质、法线、查询隔离、销毁生命周期以及基于相机的场景拾取。

---

<a id="english-documentation"></a>

# English documentation

[中文](#中文文档) | [English](#english-documentation)

`@orillusion/ray-pick` provides injectable CPU ray picking for Orillusion scenes. It tests rays against mesh triangles and is distributed as a separate package, so `@orillusion/core` does not need to be modified.

## Features

- Explicit, reversible renderer injection with no import-time side effects.
- Isolated, pooled query contexts support independent and same-instance nested queries.
- Recursive scene or object picking, sorted from nearest to farthest.
- Indexed and non-indexed mesh geometry.
- World transforms, `near` / `far`, material culling, UVs, normals, face indices and barycentric coordinates.
- Built-in support for `MeshRenderer` and `SpriteRenderer`.
- Standard Orillusion `PICK_*` pointer events through `SceneRayPick`.
- Optional Graphic3D GPU-instance integration without a hard dependency on `@orillusion/graphic`.

## Installation

Install the package together with a compatible Orillusion core version:

```bash
pnpm add @orillusion/core @orillusion/ray-pick
```

When working in this repository, Vite resolves `@orillusion/ray-pick` directly from `packages/ray-pick`.

## Basic usage

Call `installRayPick()` once before casting rays. Importing the package alone does not change renderer prototypes.

```ts
import {
    CameraUtil,
    Engine3D,
    Object3DUtil,
    Scene3D,
    Vector3,
    View3D,
} from '@orillusion/core';
import { installRayPick, Raycaster } from '@orillusion/ray-pick';

installRayPick();

const engine = await Engine3D.init();
const scene = new Scene3D();
const camera = CameraUtil.createCamera3DObject(scene, 'camera');
camera.perspective(60, engine.aspect, 0.1, 1000);
camera.lookAt(new Vector3(0, 5, 10), Vector3.ZERO, Vector3.Y_AXIS);

const cube = Object3DUtil.GetSingleCube(2, 2, 2, 0.3, 0.6, 1);
scene.addChild(cube);

const view = new View3D();
view.scene = scene;
view.camera = camera;
engine.startRenderView(view);

const raycaster = new Raycaster();
raycaster.setFromCamera(
    engine.inputSystem.mouseX,
    engine.inputSystem.mouseY,
    camera,
);

const hits = raycaster.intersectScene(scene);
const nearest = hits[0];
if (nearest) {
    console.log(nearest.object.name, nearest.point, nearest.distance);
}
```

Screen coordinates passed to `setFromCamera()` are canvas pixel coordinates, matching `Camera3D.screenPointToRay()`.

## Object and scene queries

```ts
const raycaster = new Raycaster(ray, 0.1, 1000);

// One object, including descendants by default.
const objectHits = raycaster.intersectObject(object);

// Disable descendant traversal.
const directHits = raycaster.intersectObject(object, false);

// Multiple roots.
const groupHits = raycaster.intersectObjects([rootA, rootB]);

// Entire scene.
const sceneHits = raycaster.intersectScene(scene);
```

All returned arrays are sorted by ascending world-space distance. A ray may return multiple hits for one mesh because every intersected triangle is reported.

## Pointer picking events

`SceneRayPick` connects the package raycaster to Orillusion's input system. It dispatches `PICK_OVER`, `PICK_OUT`, `PICK_MOVE`, `PICK_DOWN`, `PICK_UP` and `PICK_CLICK` both from the controller and the hit `Object3D`.

The `View3D` must have been started before calling `SceneRayPick.start()`.

```ts
import { PointerEvent3D } from '@orillusion/core';
import { installRayPick, SceneRayPick } from '@orillusion/ray-pick';

installRayPick();

// engine.startRenderView(view) must already have been called.
const scenePicker = new SceneRayPick(view).start();

scenePicker.addEventListener(
    PointerEvent3D.PICK_CLICK,
    (event: PointerEvent3D) => {
        const data = event.data as any;
        console.log('object:', event.target);
        console.log('position:', data.worldPos);
        console.log('face:', data.faceIndex);
        console.log('uv:', data.uv);
    },
    null,
);

// Object-level events use the same event data.
cube.addEventListener(
    PointerEvent3D.PICK_OVER,
    () => console.log('pointer entered cube'),
    null,
);

// Temporarily stop listening while retaining PICK_* listeners.
scenePicker.stop();

// Permanently release input and PICK_* listeners.
scenePicker.destroy();
```

`SceneRayPick` processes input while `engine.setting.pick.mode` is `ray`. Because `ray` is supplied by this external package and older core versions only declare `pixel | bound`, configure it with a narrow cast:

```ts
const engine = await Engine3D.init({
    setting: {
        pick: {
            enable: true,
            mode: 'ray' as any,
        },
    },
});
```

If the application only calls `Raycaster` manually, the core pick setting is not required.

## Graphic3D instances

Graphic3D is optional. Pass its renderer constructor explicitly so this package remains independent of `@orillusion/graphic`:

```ts
import { Graphic3DMeshRenderer } from '@orillusion/graphic';
import {
    installGraphicRayPick,
    installRayPick,
} from '@orillusion/ray-pick';

installRayPick();
installGraphicRayPick(Graphic3DMeshRenderer);
```

Each result identifies the individual instance `Object3D`, not the shared renderer owner.

## Hit result

`RaycastHit` contains:

| Field | Description |
| --- | --- |
| `distance` | World-space distance from the ray origin. |
| `point` | World-space intersection point. |
| `object` | Intersected `Object3D`. |
| `faceIndex` | Intersected triangle index; sprites use `-1`. |
| `face` | Triangle vertex indices and geometric normal. |
| `uv`, `uv1` | Barycentrically interpolated texture coordinates when available. |
| `normal` | Interpolated normal in object space when available. |
| `worldNormal` | Interpolated normal transformed by the inverse-transpose world matrix. |
| `barycoord` | Barycentric weights corresponding to face vertices `(a, b, c)`. |

`RaycastHit.worldNormal` and the `worldNormal` emitted by `SceneRayPick` are in world space. The raw `normal` field remains in object space.

## Material culling

For a single-material mesh, ray picking follows that material's `cullMode`:

- `back`: test front-facing triangles.
- `front`: reverse the tested winding.
- `none`: test both sides.

For multi-material meshes, each sub-geometry uses its corresponding material
slot and `face.materialIndex` identifies that slot. As in `RenderNode`, a
missing material or sub-geometry falls back to slot `0`.

Disabled renderers, disabled materials and sky renderers are ignored.

## Removing the injection

`uninstallRayPick()` restores every prototype changed by `installRayPick()` and `installGraphicRayPick()`:

```ts
import { uninstallRayPick } from '@orillusion/ray-pick';

scenePicker.stop();
uninstallRayPick();
```

Do not uninstall while another view still relies on injected ray picking.

## Complete sample and tests

- `samples/pick/Sample_RayPickPackage.ts` demonstrates the complete scene, pointer events, Graphic3D instances and debug hit visualization.
- `test/io/RayPickPackage.test.ts` covers injection, scene traversal, sorting, external instances, multi-material meshes, normals, query isolation, destruction lifecycle and camera-based scene picking.
