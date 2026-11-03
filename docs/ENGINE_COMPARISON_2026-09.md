# Orillusion 0.9.2 与 three.js / Babylon.js / Unity / Unreal 的差距分析（2026-09）

依据：本仓库 `src/`、`packages/`、`samples/` 的实际代码盘点（不是 README 承诺），对照四个引擎当前公开版本
（three.js r17x WebGPURenderer + TSL、Babylon.js 8、Unity 6 URP/HDRP、Unreal 5.x）。
四者中 three.js 与 Babylon 是直接竞品（同为浏览器引擎），Unity / Unreal 只作"能力天花板"参照，
它们的原生平台、编辑器体量与 Web 引擎不在同一赛道，逐项对标时会注明"不适用"。

## 1. 一句话定位

| 引擎 | 定位 | 对 Orillusion 的启示 |
| --- | --- | --- |
| Orillusion | WebGPU-only 的渲染引擎，Forward+ 与 RenderGraph 为核心，带 GIS / 大坐标特性 | 技术栈最新，包袱最少，但功能面与生态最薄 |
| three.js | 最通用的 Web 3D 库，WebGL + WebGPU 双后端，TSL 节点着色语言 | 生态与文档是护城河；Orillusion 需要在"WebGPU 原生做得更深"上找差异 |
| Babylon.js | 功能最全的 Web 引擎：编辑器、Node Material、Havok、GUI、XR | 是 Orillusion 功能缺口的最直接对照表 |
| Unity | 通用游戏引擎，编辑器驱动，URP / HDRP 两条管线 | 内容工作流（编辑器、Prefab、序列化、LOD、烘焙）的标杆 |
| Unreal | AAA 引擎：Nanite、Lumen、VSM、Substrate | 渲染上限的标杆，Web 端不可直接对标 |

## 2. 总览评分

5 = 业界领先，3 = 可用但有明显短板，1 = 缺失或仅有骨架。分数是相对同类能力的主观评估。

| 维度 | Orillusion | three.js | Babylon.js | Unity | Unreal |
| --- | --- | --- | --- | --- | --- |
| 渲染管线架构 | 4 | 3 | 4 | 5 | 5 |
| 材质 / PBR 完整度 | 3 | 5 | 5 | 5 | 5 |
| 光照 / 阴影 / GI | 3 | 3 | 4 | 5 | 5 |
| 后处理 | 3 | 4 | 5 | 5 | 5 |
| 动画系统 | 4 | 3 | 4 | 5 | 5 |
| 资产格式 / 压缩 / 流式 | 2 | 5 | 5 | 5 | 5 |
| 场景管理 / 剔除 / LOD | 2 | 3 | 4 | 5 | 5 |
| 物理 | 4 | 3（外接） | 5（Havok） | 5 | 5 |
| 2D / UI / 文本 | 2 | 2 | 5 | 5 | 5 |
| XR | 1 | 4 | 5 | 5 | 5 |
| 工具链 / 编辑器 / 调试 | 2 | 3 | 5 | 5 | 5 |
| 测试与质量保障 | 3 | 4 | 4 | 不适用 | 不适用 |
| 文档 / 社区 / 生态 | 1 | 5 | 5 | 5 | 5 |
| 包体积 / tree-shaking | 2 | 4 | 3 | 不适用 | 不适用 |
| 兼容性（WebGL 回退、移动端） | 1 | 5 | 5 | 不适用 | 不适用 |

Orillusion 的强项：RenderGraph、Forward+ 集群光照、OIT（WBOIT + 双层深度剥离）、DDGI、PCSS、多实例、
RTE 大坐标与 3D Tiles、Rapier 物理、动画图（分层、遮罩、IK、重定向）。这些里有几项 three.js 至今没有。
弱项集中在"内容管线"（资产格式、LOD、流式、编辑器、序列化）和"生态"（文档、示例站、社区、WebGL 回退）。

## 3. 逐项对比

### 3.1 渲染管线

已有：`ForwardRendererJob` 的 pass 链（ClusterLighting → PreDepth → HiZ → MotionVector → GPUCull →
Shadow → Reflection → GI → Color → Sky → SceneColorPyramid → Transmission → Decal → 透明 → OIT → Post → GUI），
`RenderGraph` 有依赖调度、瞬态资源别名池、`dumpDot`。MSAA、TAA、FXAA、log depth、RTE、stencil 都在。

| 能力 | Orillusion | three.js | Babylon | Unity / UE |
| --- | --- | --- | --- | --- |
| 延迟管线 | 仅占位（`DeferredRendererJob` 直接 throw） | 无（Forward） | 有 PrePass / 部分延迟 | HDRP 与 UE 都是延迟 |
| GPU 剔除接入绘制 | 计算完但 ColorPass 仍走 CPU 列表 | 无 | 无 | Unity GPU Resident Drawer、UE Nanite |
| LOD | 无 | `LOD` 对象 | `LODGroup`、自动 LOD 生成 | 完整 LOD + HLOD |
| Tonemapping | 仅 ACES / None | ACES、AgX、Neutral、Reinhard、Cineon | 多种 + 颜色分级 | 完整颜色分级 |
| HDR 输出 | 无 | 有（`rgba16float` swapchain） | 有 | 有 |
| 实例化 / 批处理 | 有 InstancedMesh 与 EntityBatchCollect | InstancedMesh、BatchedMesh | Thin Instances | GPU Instancing / SRP Batcher |
| 遮挡剔除 | Hi-Z pass 已有，Occlusion 系统 98 行 | 无 | 硬件遮挡查询 | 有 |

建议：
1. **把 GPUCull 真正接入 ColorPass 的 indirect draw**，这是已完成 80% 的工作，收益最大。
2. **LOD 组件 + 屏幕空间误差**，同一套逻辑可以复用给 3D Tiles 的 `geometricError`（当前解析了但没用）。
3. Tonemap 至少补 AgX 与 Khronos Neutral（glTF 官方推荐），并把 `LUT_glsl` 接成颜色分级 pass。
4. 延迟管线要么补齐要么从 API 中移除占位，避免误导使用者。

### 3.2 材质与着色

已有：`LitMaterial` 覆盖 base / metallic-roughness / AO / normal / emissive / clearcoat / transmission /
volume / IOR / specular；SSS 与 hair 有 shader；WGSL 预处理器支持 `#include` / `#if` / 整型 uniform；
有 GLSL→WGSL 转换器。

| 能力 | Orillusion | three.js | Babylon | Unity / UE |
| --- | --- | --- | --- | --- |
| Sheen / Iridescence / Anisotropy / Dispersion | 无 | 全有 | 全有 | 有 |
| 节点材质 / 可视化着色 | 无 | TSL（代码即节点图） | Node Material Editor | Shader Graph / Material Editor |
| 自定义材质门槛 | 需写完整 WGSL pass + 注册 | `MeshStandardNodeMaterial` 插槽式扩展 | `CustomMaterial` 插入点 | 图形化 |
| 着色器热重载 | 缓存失效有，管线不重建；vite `hmr:false` | 有 | 有 | 有 |
| 皮肤 SSS | `SkinMaterial` 是 MVP 骨架，实际按普通 Lit 渲染 | 无内建 | 有 | 有 |

建议：
1. 补 sheen / iridescence / anisotropy，这是 glTF 扩展落地的前提，三个都是几十行 BRDF。
2. 设计一个 **材质插槽 API**（类似 three 的 node slot 或 Babylon 的 `CustomMaterial`），
   让用户不用复制整个 `PBRLitShader` 就能改 albedo / normal / emissive。
3. `SkinMaterial` 要么接上 `PBRLitSSSShader` 要么标 experimental。

### 3.3 光照、阴影、GI

已有：方向光 / 点光 / 聚光，IES，CSM，点光 cube shadow，PCF / PCSS，静态阴影缓存，接触阴影，
DDGI 探针体，SSGI（实验），反射探针 + IBL 预过滤，SSR，GTAO。

| 能力 | Orillusion | three.js | Babylon | Unity / UE |
| --- | --- | --- | --- | --- |
| 面光源 | 无（仅有 `rectLight` import 名） | RectAreaLight（LTC） | Area lights（8.x） | 有 |
| Lightmap / 烘焙 | 无 | 支持贴图 | 支持 + 在线烘焙 | 完整烘焙器 |
| VSM / ESM | 无 | VSM | ESM、PCSS、级联 | VSM（UE）、PCSS |
| 实时 GI | DDGI 可用；VCT 是骨架；SSGI 实验 | 无 | 无（只有 SSR / 反射探针） | Lumen / SSGI / APV |
| IBL 阴影 | 无 | 无 | 有（8.0） | 有 |
| 体积光 / 雾 | GodRay + GlobalFog；`_Sample_VolumetricFog` 停用 | 无内建 | 有体积光 | 有 |

建议：
1. **面光源（LTC）**：three 与 Babylon 都有，产品/建筑可视化场景必需。
2. **Lightmap 读取**：只做读取（UV2 + 贴图），不做烘焙，就能承接 Blender / Unity 导出的静态场景。
3. 清理 `VoxelConeTracingGI` 骨架与 `postProcessing.ssao` 无消费的设置项，把 SSGI 要么做完要么下线。

### 3.4 后处理

已有 16 个 Post 类（Bloom、TAA、FXAA、Tonemap、GTAO、SSR、SSGI、DoF、GlobalFog、VolumetricFog、
GodRay、Outline、Skyline、ContactShadow、GBuffer 调试）。数量上不弱于 three（EffectComposer 系）。

缺：运动模糊（MotionVector 已经算了但没人用）、色差、暗角、胶片颗粒、镜头光晕、颜色分级 LUT、SMAA。
`packages/post/index.ts` 是空文件。

建议：补运动模糊 + 颜色分级 + 暗角三件套即可追平 Babylon 的 `DefaultRenderingPipeline`；
把 `packages/post` 要么填充要么删除。

### 3.5 动画

已有：GPU 蒙皮（compute）、`AnimatorComponent`（crossFade、分层、遮罩、附加混合、状态机钩子、
`retargetTo`、IK 挂载）、1D BlendTree、CCD / TwoBone IK、重定向、morph、曲线 / 属性动画、动画事件。

这一块是 Orillusion 相对 three.js 的**优势项**（three 只有 `AnimationMixer` + 少量 IK 示例），
与 Babylon 相当。对 Unity 的差距：

| 能力 | Orillusion | Unity / UE |
| --- | --- | --- |
| 2D BlendTree | 无 | 有 |
| 时间轴 / Sequencer | 无 | Timeline / Sequencer |
| 可视化状态机 | 仅代码钩子 | Animator 窗口 / Anim BP |
| 根运动 | 重定向选项里有 | 完整 |
| 物理动画（ragdoll） | 需自己拼 Rapier 关节 | 有 |

建议：2D BlendTree 与一个简单的 Timeline（关键帧 + 事件轨道）即可覆盖大部分 Web 场景需求。

### 3.6 资产格式、压缩与流式

这是与 three / Babylon 差距最大的一块。

| 能力 | Orillusion | three.js | Babylon |
| --- | --- | --- | --- |
| glTF 扩展 | clearcoat、unlit、emissive_strength、ior、transmission、volume、texture_transform、lights_punctual、draco | 几乎全部 KHR / EXT | 几乎全部 |
| sheen / specular / variants / quantization / basisu | 空的 8 行 stub 类 | 有 | 有 |
| KTX2 / Basis 转码 | 无（只有 BC7 枚举） | 有 | 有 |
| meshopt / EXT_mesh_gpu_instancing | 无 | 有 | 有 |
| FBX / OBJ / USD / EXR | 仅 OBJ、RGBE | FBX、OBJ、USDZ、EXR、PLY、STL 等几十种 | 大部分 |
| 3D Tiles | 有，但整棵树一次性加载，`geometricError` / `refine` 没消费 | 社区 `3DTilesRendererJS` | 有 |
| 资源缓存 / 引用计数 | URL 级缓存 | `Cache` + 引用计数 | `AssetContainer` |
| Web Worker 解码 | 无 | Draco / KTX2 都在 worker | 有 |

建议（按收益排序）：
1. **KTX2 + Basis Universal 转码**（worker 内）。WebGPU 上没有压缩纹理意味着移动端显存直接翻 4–8 倍。
2. 把 5 个 stub 扩展做实：`KHR_materials_sheen / specular / variants`、`KHR_mesh_quantization`、
   `KHR_texture_basisu`。其中 quantization 只是顶点格式映射。
3. 3D Tiles 的 **SSE 驱动的加载 / 卸载**，否则 GIS 场景无法上规模。
4. `EXT_meshopt_compression` + `EXT_mesh_gpu_instancing`（后者可直接映射到 `InstancedMesh`）。

### 3.7 场景管理、剔除、拾取、空间结构

已有：Object3D 组件模型（Unity 风格，不是真 ECS）、WASM 矩阵、八叉树 / KD 树 / 四叉树、
GPU 像素拾取 + 碰撞体射线拾取。

缺：BVH（网格射线是暴力遍历）、`BoundingBox.intersectsRay` 与 `BoundingSphere.updateBound` 直接 throw "not implemented"、
LOD、场景序列化（只有 prefab 导入没有导出）。three 有社区 `three-mesh-bvh`，Babylon 有场景序列化 / `.babylon`。

建议：先补两个 throw 的方法与一个 BVH，再考虑场景保存格式。

### 3.8 物理、粒子、特效、UI、音视频

| 能力 | Orillusion | three.js | Babylon | Unity / UE |
| --- | --- | --- | --- | --- |
| 物理 | Ammo + Rapier 双后端，车辆 / 角色 / 快照 | 无内建（社区 Rapier / cannon） | Havok（WASM）、Ammo、Cannon | PhysX / Chaos |
| 粒子 | CPU / compute 混合系统，`GPUParticleSystem` 是骨架 | 无内建 | GPU 粒子 + 编辑器 | VFX Graph / Niagara |
| UI | 无（GUIPass 只是 present blit） | 无 | 完整 2D GUI + 3D GUI | uGUI / UI Toolkit / UMG |
| 文本 | canvas 贴图 + opentype 3D 文字 | Troika（社区 SDF） | 有 | 有 |
| 音视频 | 位置音频、视频贴图、抠像 | 位置音频 | 有 | 有 |
| 地形 / 水 | TerrainGeometry、无水体 | 无 | 有水体 / 地形 | 有 |
| 导航网格 | A* + funnel，示例停用，无生成器 | 无 | Recast（WASM） | 有 |

Rapier 集成是亮点（Babylon 之外唯一把角色控制器、车辆、快照做全的 Web 引擎），
但本次巡检发现它跟随的 Rapier API 版本落后（详见 `BUG_AUDIT_2026-09.md`），需要加一条 CI 用例覆盖。
UI 是最明显的空白：任何产品级应用都需要 HUD / 标签 / 面板，目前只能靠 DOM 叠加。

### 3.9 相机与控制

有 5 种控制器与 ortho / perspective，缺物理相机模型（感光度 / 光圈 / 快门联动曝光与 DoF）
与轨道相机组件。Babylon 有 `ArcRotate / Universal / Follow / Device orientation` 等十余种。

### 3.10 工具链、DX、质量保障

| 能力 | Orillusion | three.js | Babylon | Unity / UE |
| --- | --- | --- | --- | --- |
| 编辑器 | 无 | 官方在线 editor（轻量） | Playground + Inspector + Editor | 核心竞争力 |
| 运行时 Inspector | dat.gui 封装 + Stats | 社区 | 内建 Inspector（场景树、材质、后处理全可调） | 有 |
| 帧调试 | `GBufferPost`、split debug、`dumpDot` | Spector.js（社区） | Spector.js（同团队）+ 帧统计 | RenderDoc / Frame Debugger |
| 测试 | Electron + SwiftShader，54 个文件，无截图回归 | 单元 + e2e 截图回归（每个 example 一张） | 视觉回归 + 单元 | 内部 |
| 文档 | typedoc 生成，无手册；示例站需自己跑 | 文档 + 手册 + 几百个在线示例 | 文档 + Playground 即时可改 | 完整 |
| TypeScript | 全 TS | 类型包 | 全 TS | C# / C++ |
| tree-shaking | `index.ts` 是全量桶文件，无 `sideEffects` | 好 | 一般 | 不适用 |
| WebGL 回退 | 无，直接 throw | 自动回退 | 自动回退 | 不适用 |
| OffscreenCanvas / Worker 渲染 | 不支持（依赖 DOM canvas） | 支持 | 支持 | 不适用 |
| WebXR | 无 | 完整 | 完整 | 不适用 |
| 移动端 | 有触控，无质量分档 | 有 | 有 | 有 |
| 多实例 / 多视口 | 有（本次 v2 重点） | 有 | 有 | 有 |

建议：
1. **截图回归测试**：现有 Electron 基础设施已经能跑 WebGPU，只差"每个示例截一张图 + 比对"。
   本次巡检就是靠人工截图找 bug，自动化后能挡住绝大多数渲染回归。
2. **Inspector**：把已有的 dat.gui 面板产品化成场景树 + 材质 + 后处理的通用检视器，成本远低于编辑器。
3. `package.json` 加 `sideEffects: false`，检查副作用注册（`MaterialRegister`、`ShaderLib.register`）改成显式导入。
4. WebGL 回退可以不做（这是 Orillusion 的定位），但**必须提供能力检测 + 友好降级页面**的官方方案。
5. WebXR 至少做到 `immersive-vr` 的 `XRWebGLBinding` 等价物（WebGPU 的 `XRGPUBinding` 已在 Chrome 落地）。

### 3.11 数学库

v2 已对齐 three.js 命名，缺 `Euler`、`Spherical`（现在是 OrbitController 的私有类）、`Cylindrical`、
`Box2`、`Matrix2`、CatmullRom / 样条曲线、`SphericalHarmonics3`。`MathUtil` 里有角度制 / 弧度制不一致的 TODO。

### 3.12 性能与规模（结构性判断，未做基准）

- 优点：WASM 矩阵、集群光照、OIT、Hi-Z、瞬态资源别名，都是 three.js 没有或刚有的。
- 隐患：矩阵每帧整表上传（本次修了 staging 池泄漏，但方式本身仍是"全量拷贝"，
  改成脏区间上传或 `queue.writeBuffer` 更简单）；CPU 侧绘制列表没接 GPU cull；
  无 LOD 意味着大场景只能靠遮挡剔除；`Matrix4.maxCount` 固定分配。
- 建议做一组公开基准（10 万实例、1 万光源、大 glTF 加载时间）并放进 CI 记录趋势。

## 4. 建议的优先级

**P0（3 个月内，决定"能不能用于产品"）**
1. KTX2 / Basis 纹理压缩 + worker 解码
2. LOD 组件 + GPU cull 接入绘制
3. 截图回归测试 + 每个示例的 CI 覆盖
4. 面光源（LTC）+ sheen / iridescence / anisotropy
5. 引擎首帧 / 恢复 delta、Rapier API 版本这类"基础可靠性"问题清零（本次已修一部分）

**P1（6 个月内，决定"和 three / Babylon 比有没有理由选你"）**
1. 运行时 Inspector
2. 材质插槽 / 轻量节点式自定义材质
3. 3D Tiles 的 SSE 流式加载（Orillusion 的 GIS 差异化卖点）
4. 运动模糊 + 颜色分级 + AgX
5. 基础 UI 系统（面板、文本、图片、九宫格）
6. `sideEffects` + 桶文件拆分，给出包体积数据

**P2（长期）**
1. WebXR
2. Lightmap 读取 / 烘焙
3. 延迟管线或移除占位
4. Timeline / 2D BlendTree
5. 场景序列化格式与在线编辑器

## 5. 一页总结

Orillusion 的渲染内核已经是 WebGPU 引擎里较先进的一档（RenderGraph、Forward+、OIT、DDGI、多实例、RTE），
动画与物理也不输 Babylon。真正拉开差距的是**内容管线**（纹理压缩、LOD、流式、扩展覆盖）、
**工具链**（Inspector、截图回归、文档站）和**生态**（WebGL 回退、XR、社区示例）。
先把 P0 五项补齐，Orillusion 才能从"技术验证引擎"变成"可以承接产品项目的引擎"。
