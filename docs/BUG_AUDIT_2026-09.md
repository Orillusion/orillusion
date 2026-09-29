# 引擎 Bug 巡检报告（2026-09-27）

分支：`feat/bugfix-and-analysis-20260927`
方法：在 Chrome（WebGPU，Mac Metal）里逐个加载 `samples/` 下全部 159 个示例，捕获
`console.error` / `unhandledrejection` / `GPUDevice.uncapturederror`，同时截图目测；
并对 `src/` 与 `packages/*` 做 `tsc --noEmit`，最后跑 `npm test`（Electron + SwiftShader）。

## 结论

| 项目 | 结果 |
| --- | --- |
| Electron CI（54 个测试文件） | 修复前后均全绿 |
| 核心 `tsc` | 通过 |
| `packages/physics-rapier` `tsc` | 修复前 2 个错误，修复后通过 |
| 示例巡检 | 159 个示例全部能加载；1 个直接崩溃，1 个逻辑错误，1 个引擎级首帧问题，1 个内存/日志问题，1 个示例参数问题 |

## 已修复

### 1. Rapier `CharacterController` 崩溃（示例黑屏）

- 现象：`Sample_RapierCharacter` 黑屏，控制台 `TypeError: Physics.world.updateSceneQueries is not a function`。
- 根因：仓库根 `package.json` 依赖 `@dimforge/rapier3d-compat@^0.19.3`，而插件代码按 0.14 API 写的。
  0.15 起 `World.updateSceneQueries()` 被删除（查询管线并入 broad-phase，由 `step()` 刷新）。
  插件自己的 `package.json` 仍写着 `^0.14.0`，掩盖了 API 漂移。
- 修复：`packages/physics-rapier/character/CharacterController.ts` 改调
  `propagateModifiedBodyPositionsToColliders()`；`packages/physics-rapier/package.json` 依赖改为 `^0.19.3`。

### 2. `CharacterController` 首帧穿透地面

- 现象：修掉崩溃后，角色在第 1 帧就掉到 y = −358，永远落不到地面。
- 根因（两层叠加）：
  1. 引擎在 `renderLoop`（`Physics.update()`）之前先跑组件 `onUpdate`，所以创建当帧还没有 `world.step()`，
     broad-phase BVH 是空的，`computeColliderMovement` 扫不到地板，直接返回完整位移。
  2. 引擎首帧 `Time.delta` 是页面启动以来的整段时间（见第 3 条），重力一次积分出几十米。
- 修复：`Physics` 新增 `stepCount`；`CharacterController.move()` 在自身创建后至少经过一次 `step()` 才开始移动。

### 3. 引擎首帧 / 恢复后 `Time.delta` 巨大（引擎级）

- 现象：`Engine3D._tick` 用 `time - Time.time` 算 delta，`Time.time` 初始为 0，首帧 delta = rAF 时间戳
  （通常 1–5 秒）；`pause()` 后 `resume()` 的第一帧同样等于整个暂停时长。任何按 dt 积分的逻辑
  （物理、动画、控制器、插值器）都会在这一帧跳一大步。
- 修复：`src/Engine3D.ts` 加 `_resetDelta` 标记，循环首次启动与 `resume()` 后的第一帧使用名义 1/60 s。

### 4. 矩阵上传 staging buffer 无上限累积 + 每帧刷警告

- 现象：多数示例每帧打印
  `Warning: mapAsync requests from N frames ago have not resolved yet.  MB of staging buffers allocated.`
  实测 `GlobalBindGroup` 的矩阵 buffer 池里挂着 72 个空闲 staging buffer（每个都是整张矩阵表大小）。
- 根因：`GPUBufferBase.mapAsyncWrite` 的计数器只增不减（复用时不减），启动阶段 GPU 编译管线导致
  `mapAsync` 延迟 20+ 帧，池子一次性膨胀到几十个，之后计数永远高于阈值，警告每帧触发；
  空闲 buffer 也永远不释放，`destroy()` 也不清理它们。
- 修复：计数器改为真正的"在途"数量（resolve 时递减）；空闲池上限 3 个，多余的在 resolve 时销毁；
  `destroy()` 释放池内 buffer；警告改为每次积压只报一次并给出 MB 数；
  `MatrixGPUBuffer.writeBufferByHeap` 改为委托给同一实现（保留旧名）。

### 5. `Physics.init({ deterministic: true })` 设置了不存在的字段

- `numAdditionalFrictionIterations` 在 Rapier 0.15 已删除，赋值静默无效且 `tsc` 报错。已移除该行。

### 6. `Sample_Label` 标签重叠（示例）

- `distanceInvariantSize` 的参考深度硬编码 10 m，示例相机在 30 m，标签宽度被放大 3 倍互相盖住。
  示例相机距离改为 10。

## 确认不是 bug（巡检中误判后排除）

- **Rapier 物体悬空 / 动画不动**：Chrome 后台标签页 rAF 停止，是测试环境问题。改用 Worker 驱动帧循环后全部正常。
- **SpotLight 全黑、BoundingBox/DirectLightShadow 镜头贴脸**：`HoverCameraController` 初始插值尚未到位。
- **Skyline 无效果**：示例相机俯视，画面里没有天空边界；抬头后能看到红色描边。
- **GraphicGrass 大蓝三角**：示例本身的草叶就是纯色三角面。
- **音频 / 视频示例**：依赖 `cdn.orillusion.com` 与自动播放策略，未计入。

## 遗留（未改动，建议后续处理）

- `@dimforge/rapier3d-compat` 内部 `init()` 触发 wasm-bindgen 的
  "using deprecated parameters for the initialization function" 警告，是上游包问题。
- `packages/geometry/tsconfig.json` 缺 `experimentalDecorators`，直接 `tsc -p` 会报装饰器错误
  （构建脚本靠命令行参数补上）。
- `src/loader/parser/prefab/prefabData/APatch.ts` 装饰器里引用自身类，只有在旧式装饰器下合法。
- 详细的引擎功能缺口见 `docs/ENGINE_COMPARISON_2026-09.md`。
