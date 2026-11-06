## [0.9.5](https://github.com/Orillusion/orillusion/compare/v0.9.2...v0.9.5) (2026-11-06)


### Features

* **water:** `WaterRenderer` with Gerstner / FFT ocean waves, interactive ripples, sunlight caustics and an underwater view (opt-in via `setting.render.water`); pool, lake and ocean samples ([#511](https://github.com/Orillusion/orillusion/issues/511)) ([69ae653](https://github.com/Orillusion/orillusion/commit/69ae653a2043fdd02e9dd6b925f2cb979dc47956))
* **fluid:** `FluidRenderer` and `FluidPass` screen-space fluid rendering (opt-in via `setting.render.fluid`) — depth smoothing, optional anisotropic particles, thickness, refraction and absorption; FLIP and CPU particle samples ([#512](https://github.com/Orillusion/orillusion/issues/512)) ([1cffd8a](https://github.com/Orillusion/orillusion/commit/1cffd8a879c6ae1a6cd397d3e7a7cc05043679c7))
* **light:** `RectLight` — analytic rectangular area light (Lambert polygon form factor diffuse + representative-point GGX specular) ([#525](https://github.com/Orillusion/orillusion/issues/525)) ([d5b3e12](https://github.com/Orillusion/orillusion/commit/d5b3e128059365db782ddb7db71e07bbec5c90e1))
* **light:** the first `DirectLight` in a scene enables CSM by default; an explicit `enableCSM` assignment still wins ([#526](https://github.com/Orillusion/orillusion/issues/526)) ([b2d5e6e](https://github.com/Orillusion/orillusion/commit/b2d5e6eadcbc5a6a09c3cc1744693a76c388f556))
* **material:** `KHR_materials_sheen` — sheen lobe on `LitMaterial` + glTF extension ([#513](https://github.com/Orillusion/orillusion/issues/513)) ([671bbd1](https://github.com/Orillusion/orillusion/commit/671bbd17fddba2b874e2983918bae8ccbf5ed5f1))
* **material:** `KHR_materials_iridescence` — thin-film interference on `LitMaterial` + glTF extension ([#520](https://github.com/Orillusion/orillusion/issues/520)) ([9659cdd](https://github.com/Orillusion/orillusion/commit/9659cdd6d3f67cbf79cb994270f38774176890a6))
* **material:** `KHR_materials_anisotropy` — anisotropic specular on `LitMaterial` + glTF extension ([#521](https://github.com/Orillusion/orillusion/issues/521)) ([bdb6c0c](https://github.com/Orillusion/orillusion/commit/bdb6c0cec0ad2dc00909f9d72cec2758b7c8de3b))
* **material:** KHR extension textures — sheen, iridescence (+ thickness), specular / specular color and anisotropy maps on `LitMaterial`, bound by the glTF loader ([#526](https://github.com/Orillusion/orillusion/issues/526)) ([b2d5e6e](https://github.com/Orillusion/orillusion/commit/b2d5e6eadcbc5a6a09c3cc1744693a76c388f556))
* **gltf:** `KHR_mesh_quantization`, `KHR_materials_specular` and `KHR_materials_variants` (new `MaterialVariants` component with `selectVariant`) ([#516](https://github.com/Orillusion/orillusion/issues/516)) ([76dc157](https://github.com/Orillusion/orillusion/commit/76dc157a31395ce66ff4066c360d02b3d54f22f7))
* **post:** tonemap modes — Reinhard, Uncharted2, AgX, Khronos PBR Neutral (`TonemapSetting.mode`, `whitePoint`) with a CPU mirror `TonemapUtil` ([#510](https://github.com/Orillusion/orillusion/issues/510)) ([01128b0](https://github.com/Orillusion/orillusion/commit/01128b02afcc3312a49a6127ee820896d1be1331))
* **post:** `LensPost` — vignette, chromatic aberration, film grain ([#514](https://github.com/Orillusion/orillusion/issues/514)) ([c44cd00](https://github.com/Orillusion/orillusion/commit/c44cd00228f5ef82a2dcbb66c2cdd0a1a54512bc))
* **post:** `MotionBlurPost` — camera motion blur with `resetHistory()` ([#517](https://github.com/Orillusion/orillusion/issues/517)) ([fa46b16](https://github.com/Orillusion/orillusion/commit/fa46b166e4e7b51c1d223b5c035ff51915086601))
* **post:** `ColorGradingPost` — exposure, white balance, contrast, saturation, ASC-CDL and strip LUTs, with CPU mirror `ColorGradingUtil` ([#522](https://github.com/Orillusion/orillusion/issues/522)) ([bef7b47](https://github.com/Orillusion/orillusion/commit/bef7b47fcb1ca7d8f9fa903e6917e576d4d90ad8))
* **render:** per-object motion vectors for motion blur (`objectMotionVectors` render setting, velocity sub-pass written into `_MotionVector`) ([#527](https://github.com/Orillusion/orillusion/issues/527)) ([2f44234](https://github.com/Orillusion/orillusion/commit/2f44234c711cd2f0f58e7991eebe3d5088b249f7))
* **lod:** `LODGroup` component with screen-relative-height / distance metrics, bias, hysteresis and `forceLevel` ([#519](https://github.com/Orillusion/orillusion/issues/519)) ([f5bda99](https://github.com/Orillusion/orillusion/commit/f5bda99cad3c335dc5ab0342489036262a8c3bde))
* **pick:** `MeshBVH` triangle BVH for CPU raycasts (closest / all / any-hit queries, sub-geometries, `compose_bin` geometry, auto refit) ([#509](https://github.com/Orillusion/orillusion/issues/509)) ([2e4be97](https://github.com/Orillusion/orillusion/commit/2e4be97ba8f464e53dd7446948223e6a4dd26ef1))
  * new three.js-style `Raycaster` — CPU ray picking against mesh triangles without a collider ([#501](https://github.com/Orillusion/orillusion/issues/501))
  * `PickFire` event data with face / uv / all hits and collider filters; auto mesh collider geometry
  * picking of skinned and morph-target meshes as drawn (CPU deformation)
  * `BoundingBox.intersectsRay` and `BoundingSphere.updateBound` implemented
* **math:** `Spherical`, `Cylindrical`, `Box2`, `CatmullRomCurve3` ([#515](https://github.com/Orillusion/orillusion/issues/515)) ([f2d4944](https://github.com/Orillusion/orillusion/commit/f2d4944df4be4f1292c1fdca753a5745ec938095))
* **atmosphere:** new `@orillusion/atmosphere` package ([#444](https://github.com/Orillusion/orillusion/issues/444)) ([18cd142](https://github.com/Orillusion/orillusion/commit/18cd142025085d69792f4c8b0dbc6c477c8715ab)), ported to the multi-instance engine API with a limb-darkened sun disc and `useAsEnvMap` toggle ([37e55d8](https://github.com/Orillusion/orillusion/commit/37e55d8ef053138ddb7f7b12ac841504705abecb))


### Bug Fixes

* **geometry:** `SphereGeometry` / `TorusGeometry` / `CylinderGeometry` / `StripeGeometry` switch to 32-bit indices past 65535 vertices; `PlaneGeometry` index type check fixed ([#528](https://github.com/Orillusion/orillusion/issues/528)) ([643632b](https://github.com/Orillusion/orillusion/commit/643632baf5a524567d3fddd7e7500d455b09d5ab))
* **pick:** `Raycaster` skips sky spheres unless `includeSky` is set ([#528](https://github.com/Orillusion/orillusion/issues/528)) ([643632b](https://github.com/Orillusion/orillusion/commit/643632baf5a524567d3fddd7e7500d455b09d5ab))
* **pick:** world-space hits for every collider shape, nearest hit for `MeshColliderShape`, inverse-transpose normals, and `screenPointToRay` canvas-offset fix ([#509](https://github.com/Orillusion/orillusion/issues/509)) ([2e4be97](https://github.com/Orillusion/orillusion/commit/2e4be97ba8f464e53dd7446948223e6a4dd26ef1))
* **post:** `MotionBlurPost.resetHistory()` also resets object motion vectors; first frame writes zero motion ([#528](https://github.com/Orillusion/orillusion/issues/528)) ([643632b](https://github.com/Orillusion/orillusion/commit/643632baf5a524567d3fddd7e7500d455b09d5ab))
* **gltf:** non-indexed primitives no longer overflow a `Uint8Array` fallback index buffer (meshes over 85 triangles were scrambled) ([#516](https://github.com/Orillusion/orillusion/issues/516)) ([76dc157](https://github.com/Orillusion/orillusion/commit/76dc157a31395ce66ff4066c360d02b3d54f22f7))
* **texture:** base64 data-URI textures no longer hang forever in background tabs ([#518](https://github.com/Orillusion/orillusion/issues/518)) ([aaf06d7](https://github.com/Orillusion/orillusion/commit/aaf06d771cce1551c8d9389efc134cd06d3ce7c0))
* **shader:** pooled reflection no longer overwritten when a pass changes variant ([#511](https://github.com/Orillusion/orillusion/issues/511)) ([69ae653](https://github.com/Orillusion/orillusion/commit/69ae653a2043fdd02e9dd6b925f2cb979dc47956))
* **shader:** bind group entries get only the shader stages that reach them (`ShaderStageUsage`, nested calls included); texture bind group regenerated when layouts rebuild ([#526](https://github.com/Orillusion/orillusion/issues/526)) ([b2d5e6e](https://github.com/Orillusion/orillusion/commit/b2d5e6eadcbc5a6a09c3cc1744693a76c388f556))
* **engine:** first frame and post-resume frame use a nominal 1/60 s `Time.delta`; `GPUBufferBase.mapAsyncWrite` staging-buffer pool leak ([#519](https://github.com/Orillusion/orillusion/issues/519)) ([f5bda99](https://github.com/Orillusion/orillusion/commit/f5bda99cad3c335dc5ab0342489036262a8c3bde))
* **physics-rapier:** adapt to Rapier 0.19 API changes ([#519](https://github.com/Orillusion/orillusion/issues/519)) ([f5bda99](https://github.com/Orillusion/orillusion/commit/f5bda99cad3c335dc5ab0342489036262a8c3bde))
* **atmosphere:** fix multi-scattering / sky-view LUT dispatch sizes, uniform padding and a compute shader leak ([37e55d8](https://github.com/Orillusion/orillusion/commit/37e55d8ef053138ddb7f7b12ac841504705abecb))
* **sprite:** stabilize `BillboardY` at vertical view angles ([#503](https://github.com/Orillusion/orillusion/issues/503)) ([c477ae0](https://github.com/Orillusion/orillusion/commit/c477ae08e8cdddc2c54bb6ed5fe63013d90ebe13))
* **math:** `Plane.intersectsRay` hit for parallel rays ([#507](https://github.com/Orillusion/orillusion/issues/507)) ([1172ba1](https://github.com/Orillusion/orillusion/commit/1172ba1febccafda828bfbf321a839a43f22d114))
* **math:** correct `Vector2.lerp` endpoint order ([#508](https://github.com/Orillusion/orillusion/issues/508)) ([5cdec3c](https://github.com/Orillusion/orillusion/commit/5cdec3c448d02097d8de9534003d7f8f3bf4e826))
* **test:** wait for rendered frames instead of wall-clock delays before GPU readbacks ([#524](https://github.com/Orillusion/orillusion/issues/524)) ([f90b4d5](https://github.com/Orillusion/orillusion/commit/f90b4d5e5da5a2cc19ff3c70a8de05e9a13b12aa)); fail the running test on GPU device loss or uncaptured GPU errors ([#526](https://github.com/Orillusion/orillusion/issues/526)) ([b2d5e6e](https://github.com/Orillusion/orillusion/commit/b2d5e6eadcbc5a6a09c3cc1744693a76c388f556))



## [0.9.2](https://github.com/Orillusion/orillusion/compare/v0.8.4...v0.9.2) (2026-07-31)


### Features

* **engine:** v2 engine refactor — RenderGraph rewrite, Rapier physics, three.js-aligned math ([7fdecee](https://github.com/Orillusion/orillusion/commit/7fdecee0e1596600155f23f07d9bdbf48a0e2e4c))
  * **RenderGraph:** typed `RenderTarget` / `RenderPass` / `ComputePass` handles; passes split into single-responsibility units (pre-depth, clear, transparent, present…); pass scheduling driven by reads/writes + explicit `dependsOn` edges (`RenderStage` removed); transient resource subsystem with lifetime-aware aliasing pool (HiZ, SceneColorPyramid, OIT/DDP, MotionVector); runtime pass hot-swap that survives canvas resize
  * **physics:** new `@orillusion/physics-rapier` backend with snapshot save/restore, vehicle controller, kinematic/dynamic body handling
  * **math:** three.js-aligned math library — canonical method names, mutator-style arithmetic, three.js standard instance methods + tests
  * **rendering:** logarithmic depth + relative-to-eye (RTE) precision for ECEF/large-scale scenes; built-in projected decals; opt-in stencil buffer; `VisibleLayer` bitmask filtering; earth sky & atmosphere renderers; shader preprocessor with boolean `#if`/`#elseif` and Int32 uniforms; multi-engine / per-`Context3D` resources; spot/point/contact shadow fixes; sRGB panorama decoding
  * **samples & tests:** new alpha/transparency, sprite, navmesh, skeleton IK, lightbulb and Rapier samples; new test infrastructure under `test/multi` (+ playwright runners); TypeDoc 0.28
* **packages:** update all plugin packages to the v2 engine APIs ([0698014](https://github.com/Orillusion/orillusion/commit/06980144041ad677e48a13ec82f6754653b44b18))
* **RTE:** add relative-to-eye (RTE) rendering, double-precision matrix support and CSM shadow updates for large-coordinate scenes ([b1009d5](https://github.com/Orillusion/orillusion/commit/b1009d58ca134e4e937ba74658c9e3ae1779a89f))
* **particle:** particle system supports RTE rendering ([945709a](https://github.com/Orillusion/orillusion/commit/945709ae14efd66384446a3b341bc79063227c3b))
* **overlay:** added OverlayView with a dedicated overlay color pass ([675d415](https://github.com/Orillusion/orillusion/commit/675d4155544a8155e66a7df09552a7db782ef804))
* **matrix:** added an index recycling pool to `Matrix4` ([893b342](https://github.com/Orillusion/orillusion/commit/893b34248f4ec4e530674506ec14099978f1185c))
* **matrix:** move `wasm-matrix` into core ([0f1d38e](https://github.com/Orillusion/orillusion/commit/0f1d38e9ce5622753d9a7f526ae0d64ce6247270))
* **TextGeometry:** support single sided text ([#492](https://github.com/Orillusion/orillusion/issues/492)) ([a54c302](https://github.com/Orillusion/orillusion/commit/a54c302be425cfb0e46f28883d31d3c8e2c2d5e9))


### Bug Fixes

* **engine:** improve pause/resume handling ([edee564](https://github.com/Orillusion/orillusion/commit/edee5643901b47fa9a0cf17fd66fc6c13f0439e2))
* **canvas:** render to transparent canvas with correct alpha blending ([dce2948](https://github.com/Orillusion/orillusion/commit/dce29481de5a793d1315da8d6d657559ba28823a))
* **material:** fix background transparency in PBR transmission shader ([de726d3](https://github.com/Orillusion/orillusion/commit/de726d3c159bac54f33ab1a8f1ef277fb6cbecb2))
* **lambert:** fix lambert material opacity ([df914e9](https://github.com/Orillusion/orillusion/commit/df914e90341ccda032af374bbcaae9eab646be03))
* **gltf:** fix `KHR_materials_volume` parsing ([951a1d4](https://github.com/Orillusion/orillusion/commit/951a1d4fbf014f884d41945ae935299c72b7f7b3))
* **gltf:** problems during glb file parsing ([#489](https://github.com/Orillusion/orillusion/issues/489)) ([d78d4bf](https://github.com/Orillusion/orillusion/commit/d78d4bfad36aae35ea5585b16111817f0c1caa9b))
* **shadow:** fix shadow pass cull mode ([42ba979](https://github.com/Orillusion/orillusion/commit/42ba979d18e0396c4ac0e17e3421a9209080618c))
* **bloom:** fix bloom effect ([189d833](https://github.com/Orillusion/orillusion/commit/189d8335f8e1a33fca872ba56b39e1273c5acc78))
* **taa:** resolve persistent camera drift under TAA post-processing ([2aa531f](https://github.com/Orillusion/orillusion/commit/2aa531f5f9818367a5db557ec62f0d65683c94fe))
* **sky:** sky rendering with ortho camera ([#467](https://github.com/Orillusion/orillusion/issues/467)) ([8004339](https://github.com/Orillusion/orillusion/commit/8004339b115154f9f1d81ec9f6cd97d183600fad))
* **camera:** fix orthogonal camera rendering error ([#466](https://github.com/Orillusion/orillusion/issues/466)) ([5dedb08](https://github.com/Orillusion/orillusion/commit/5dedb08a877f11012048e555857d48d4e4864cf2))
* **atmospheric:** fix atmospheric sky on Apple M3 chips ([#465](https://github.com/Orillusion/orillusion/issues/465)) ([9fa23b4](https://github.com/Orillusion/orillusion/commit/9fa23b403f945ef1390eb74414ffb56a0d3aa441))
* **matrix:** fixed wasmMatrix continuous rotation ([29fef40](https://github.com/Orillusion/orillusion/commit/29fef40e86d22c6809519e5e3c17211112640301))
* **lookAt:** update matrix by quaternion ([beccb4f](https://github.com/Orillusion/orillusion/commit/beccb4ff69189c4eb4333e270c67518eb706e4c8))
* **frustum:** fixed intersection test of bounding box and frustum ([6338c2f](https://github.com/Orillusion/orillusion/commit/6338c2f9deba1f931cabce24539abd0e63c56894))
* **particle:** fixed particle billboard matrix ([553bf0a](https://github.com/Orillusion/orillusion/commit/553bf0a1fb807e7988928b3ba7663900b670e61b))
* **vertexBuffer:** split vertex data and vertex layout ([faded84](https://github.com/Orillusion/orillusion/commit/faded845a777b213fa1e8b6beb9a2dd27ed67b91))
* **geometry:** fix geometry destroy ([2ae787d](https://github.com/Orillusion/orillusion/commit/2ae787d82f061ced65c4238bd93229c4703ca4cb))
* **InstanceDraw:** fix InstanceDrawComponent ([64485cf](https://github.com/Orillusion/orillusion/commit/64485cf01f3da81943e048594379660eda1cbee2))
* **texture:** unable to force destroy texture ([#457](https://github.com/Orillusion/orillusion/issues/457)) ([3d62dc6](https://github.com/Orillusion/orillusion/commit/3d62dc65c39dc0338a230eb1d9b64cfd49d5c0ec))
* **envMap:** fix environment map reference count error ([95052f9](https://github.com/Orillusion/orillusion/commit/95052f93f598ae0ff294e58f9f1a01af84106bff))
* **graphic:** fix depth test for graphic lines ([e8257bc](https://github.com/Orillusion/orillusion/commit/e8257bcaff5f0f77f79871d47cb2167f459b6a85))
* **pick:** fix the precision of pixelPick meshID ([1801b05](https://github.com/Orillusion/orillusion/commit/1801b054aecdab888165d7161475d64221ea1737))
* **pixelRatio:** reset pixelRatio on resize ([1d8d23b](https://github.com/Orillusion/orillusion/commit/1d8d23be93e0809d07f151006addfb9ff4b686f2))
* **pointerEvent:** remove middle pointer events ([c5e369f](https://github.com/Orillusion/orillusion/commit/c5e369fe6271488ab2dd048cb640e12448f3c49c))
* **event:** CEventDispatcher properly throws the exception message ([c5b345c](https://github.com/Orillusion/orillusion/commit/c5b345c728b3f251957610dd879c97324f044f15))
* **umd:** fix packages umd names ([4828b65](https://github.com/Orillusion/orillusion/commit/4828b65257fcaa6df35a735aa42e67fded757ce4))
* **sample:** fix sample depth texture ([#484](https://github.com/Orillusion/orillusion/issues/484)) ([0400ab1](https://github.com/Orillusion/orillusion/commit/0400ab16b637b33e94082b7ffa4964fdbf2d2e8d))
* **sample:** fix Shape3D / BunnySimulator / ClothSimulator / grass color samples ([54539e6](https://github.com/Orillusion/orillusion/commit/54539e6d72759b85418cfcbf4630bd64e918943d), [e2bd519](https://github.com/Orillusion/orillusion/commit/e2bd519897d7f8816940b965d797f3f73fb44143), [65ecca1](https://github.com/Orillusion/orillusion/commit/65ecca16125a8a254705138ee1927dbb45af8a50), [f4bea6d](https://github.com/Orillusion/orillusion/commit/f4bea6d20c1c8f68919cca1d5ab9b302eeacd607))


### Performance Improvements

* **preprocessor:** add shader parse cache to ShaderLib/Preprocessor ([230c342](https://github.com/Orillusion/orillusion/commit/230c3428b2e6a7546c9bc860641cde9c053d888d))
* **matrix4:** external epsilon for matrix4 ([#486](https://github.com/Orillusion/orillusion/issues/486)) ([2befb43](https://github.com/Orillusion/orillusion/commit/2befb433e0cfaa28a55156bb7a91017af1f8fdff))
* **geometry:** change default `GeometryVertexType` to `split` ([696277b](https://github.com/Orillusion/orillusion/commit/696277b2b5877bd417b79fe397ca2e2a0cab36b5))


### BREAKING CHANGES

* **math:** methods renamed to three.js canonical names with mutator-style semantics; duplicate aliases collapsed
* **renderJob:** `RenderPass`/`RenderTarget` APIs redesigned around typed handles; `RenderStage` removed
* **renderLayer:** `renderLayer` → `visibleLayer`; `RenderLayer` enum → `VisibleLayer`



## [0.8.4](https://github.com/Orillusion/orillusion/compare/v0.8.3...v0.8.4) (2024-11-27)


### Bug Fixes

* **destroy:** render error after obj.destroy() ([1e79847](https://github.com/Orillusion/orillusion/commit/1e798475f06dea6ee078469147c8f5da10d85ff0))
* **extrudeGeometry:** fix shape in CCW order ([a7c8d01](https://github.com/Orillusion/orillusion/commit/a7c8d01bfe956530dd774024acff005fa2d5163f))
* **frameRate:** render on small frameRate ([8b685b9](https://github.com/Orillusion/orillusion/commit/8b685b99ffbf345355bce7f977484a4ce091c25c))
* **geometry:** CylinderGeometry non-manifold ([#451](https://github.com/Orillusion/orillusion/issues/451)) ([bf14c61](https://github.com/Orillusion/orillusion/commit/bf14c612caae5e36661151c019990e3d9fffa5c6))
* **graphic3d:** fix graphic clear & destroy ([eff6082](https://github.com/Orillusion/orillusion/commit/eff6082495e85b14ca7baf313d2693e295eda06f))
* **graphics3D:** fix buildCircle with custom up ([8e0354a](https://github.com/Orillusion/orillusion/commit/8e0354adbdb2043a41541f06c437cd1acf850b30))
* **pick:** add pick info in bound mode ([3fba2c5](https://github.com/Orillusion/orillusion/commit/3fba2c55db3ac0320811f8792392e5042c32811d))
* **pick:** add worldNormal in bound pick ([4b5bc9c](https://github.com/Orillusion/orillusion/commit/4b5bc9c2d4bad5778fe24156763af0fe9347d2ec))
* resolve issue with resume() being invoked multiple times ([9b2d7d1](https://github.com/Orillusion/orillusion/commit/9b2d7d1eb23059dabdbd2e289c7464d231c0e597))
* **type:** refine PointerEvents types ([3029b5c](https://github.com/Orillusion/orillusion/commit/3029b5cc940ed140dcd4d05b4a3b76a8c270cda5))


### Features

* [WIP] double precision matrix support ([52ab9c5](https://github.com/Orillusion/orillusion/commit/52ab9c53d54f29b4c8de751ae616a1e0218b00a9))
* **ExtrudeGeometry:** add anchor point offset ([#452](https://github.com/Orillusion/orillusion/issues/452)) ([fc2303d](https://github.com/Orillusion/orillusion/commit/fc2303da4d948551d102309cbeb9d9dda762cb83))


## [0.8.3](https://github.com/Orillusion/orillusion/compare/v0.8.2...v0.8.3) (2024-08-28)


### Bug Fixes

* fix frameRate and camera resize ([c4b8626](https://github.com/Orillusion/orillusion/commit/c4b8626c91937d50fba1a2d94101e84053a83d4c))
* fix InstanceDraw destroy error ([4529594](https://github.com/Orillusion/orillusion/commit/4529594491e111e2d98ca4319189215614d97654))
* **GUI:** add option to receive post effects ([#426](https://github.com/Orillusion/orillusion/issues/426)) ([af74bb1](https://github.com/Orillusion/orillusion/commit/af74bb1c14a1ee42af749868271f9b45a65c2384))
* **inputsystem:** capture pointer on pointerdown ([#432](https://github.com/Orillusion/orillusion/issues/432)) ([cc90b82](https://github.com/Orillusion/orillusion/commit/cc90b82d4d9ab8250553263e3c0499a84e3e503c))
* **shadow:** fix acceptShadow ([4d6a838](https://github.com/Orillusion/orillusion/commit/4d6a8387310381d158fc13bc168cc7482cc656b3))
* **transform:** fix lookAt at vertical angle ([#431](https://github.com/Orillusion/orillusion/issues/431)) ([1922f18](https://github.com/Orillusion/orillusion/commit/1922f185f67b450dcbb04216ee30dfba8cc0e0a2))


### Features

* add GridObject ([#436](https://github.com/Orillusion/orillusion/issues/436)) ([a939ce6](https://github.com/Orillusion/orillusion/commit/a939ce62ccbe3e6db6e964ebcf2921d975b23a1c))
* **geometry:** add extra geometry package, extrude geometry and text geometry ([#442](https://github.com/Orillusion/orillusion/issues/442)) ([069e6d4](https://github.com/Orillusion/orillusion/commit/069e6d40d4510be09dfe3c7af9ac1b97bb855ccd))
* **graphic:** move graphic3D to @orillusion/graphic ([#427](https://github.com/Orillusion/orillusion/issues/427)) ([a1d1b2a](https://github.com/Orillusion/orillusion/commit/a1d1b2aa9fc0b6abc55ad7894312f1100f6b466e))
* **physics:** add RopeSoftBody, rigidbody dragger, and enhance collisionShapeUtil ([#448](https://github.com/Orillusion/orillusion/issues/448)) ([452d730](https://github.com/Orillusion/orillusion/commit/452d730ef3377867cd81fe6d78e3a1b744c4e2b5))
* **physics:** Refactor physics plugin with extensive enhancements and new features ([#440](https://github.com/Orillusion/orillusion/issues/440)) ([7c18db5](https://github.com/Orillusion/orillusion/commit/7c18db5157a0001c9f056e6c7a158e62ff5f0e2b))



## [0.8.2](https://github.com/Orillusion/orillusion/compare/v0.8.1...v0.8.2) (2024-07-21)


### Bug Fixes

* **doc:** fix TextureCube order ([#388](https://github.com/Orillusion/orillusion/issues/388)) ([#421](https://github.com/Orillusion/orillusion/issues/421)) ([7e4e15d](https://github.com/Orillusion/orillusion/commit/7e4e15d1500d1e16e5a780123f78d602be9a9708))
* **MeshRenderer:** replace geometry error ([#415](https://github.com/Orillusion/orillusion/issues/415)) ([c79e287](https://github.com/Orillusion/orillusion/commit/c79e2878c61480583ea4a73188e0e81c395d0dcb))
* **PCF:** PCF shadow error ([#371](https://github.com/Orillusion/orillusion/issues/371)) ([c47257c](https://github.com/Orillusion/orillusion/commit/c47257c47d65c1e5c3ee4f0eae0b2bf42295561c))
* **pick:** fix undefined values ([#416](https://github.com/Orillusion/orillusion/issues/416)) ([5548467](https://github.com/Orillusion/orillusion/commit/55484676627198c1b646c3944f4077e0b639adb0))
* **pick:** fix gui pick events ([#422](https://github.com/Orillusion/orillusion/issues/422)) ([367f469](https://github.com/Orillusion/orillusion/commit/367f46904325e87b3f8a257d5cc3e44f96510132))
* **pick:** fix right click ([#418](https://github.com/Orillusion/orillusion/issues/418)) ([b248c45](https://github.com/Orillusion/orillusion/commit/b248c455c428edc4b4c7233d39c6449e31322b12))


### BREAKING CHANGES
* **PointerEvent3D:** simplified `event.data` with `{worldPos, screenUv, meshID, worldNormal}`


## [0.8.1](https://github.com/Orillusion/orillusion/compare/v0.7.2...v0.8.1) (2024-07-10)


### Bug Fixes

* **canvas:** fix external canvas resize on dpi change ([2e54053](https://github.com/Orillusion/orillusion/commit/2e54053efbffbd1d70d2a1b7c2e2f62ca672c4e9))
* **effect:** fix grass get uniform data ([588721f](https://github.com/Orillusion/orillusion/commit/588721f52013fb9cadbe5d8156a41d2110636ac7))
* **effect:** update windSpeed ([538ec2d](https://github.com/Orillusion/orillusion/commit/538ec2df976e1a45d13e3deaf15ef7c15fe5b409))
* Error when lineJoin is set to round ([#366](https://github.com/Orillusion/orillusion/issues/366)) ([1ab8718](https://github.com/Orillusion/orillusion/commit/1ab87183c6910c2fc3e61d940b0183a2d5597b08))
* fix issue of [#387](https://github.com/Orillusion/orillusion/issues/387) ([#394](https://github.com/Orillusion/orillusion/issues/394)) ([6271c37](https://github.com/Orillusion/orillusion/commit/6271c3748a1520cd444431200f7ec35111af049e))
* **GlobalUniformGroup:** missing property for shadow camera ([1f90393](https://github.com/Orillusion/orillusion/commit/1f903935fc50be16763067b888c0c37cae860c5c))
* **loaderFunctions:** onUrl on loadGltf ([65bda50](https://github.com/Orillusion/orillusion/commit/65bda50eac61694bb4e8354ee2f1744c876bd7ba))
* object is disabled after removeChild  ([#381](https://github.com/Orillusion/orillusion/issues/381)) ([51ff3ee](https://github.com/Orillusion/orillusion/commit/51ff3ee84fb8aae46819d5c7db914b3dc873062f))
* **objparser:** loadObj crash [#372](https://github.com/Orillusion/orillusion/issues/372) ([b3e9194](https://github.com/Orillusion/orillusion/commit/b3e9194630c9d0f3ab5a1cbc92dc7b760dd58f8b))
* **picker:** missing normal in pickFire ([4e05c04](https://github.com/Orillusion/orillusion/commit/4e05c04dd22cccfb44e63c8dd2af859d4ff01c86))
* **pick:** fix normal in pickInfo ([5197317](https://github.com/Orillusion/orillusion/commit/519731748ba046dd28891d99899e68e61a77c409))
* Solve the issues mentioned in Issue367 ([#368](https://github.com/Orillusion/orillusion/issues/368)) ([7ab2f48](https://github.com/Orillusion/orillusion/commit/7ab2f489dfca66b6cb2cb84111097b430bb87c34))
* **transform:** fix wrong localRotQuat ([8c5e2b3](https://github.com/Orillusion/orillusion/commit/8c5e2b3606378009045a460edf841e5d36142de8))


### Features

* **Animator:** Unified skeleton animation and morph animation to AnimatorComponent ([#405](https://github.com/Orillusion/orillusion/issues/405)) ([4cf51f3](https://github.com/Orillusion/orillusion/commit/4cf51f34937da6800f6cde2487defe12fe87ba8f))
* **buffer:** return promise result ([590b213](https://github.com/Orillusion/orillusion/commit/590b213d41dd26ca86e1780376a7e04ece8a5166))
* **GBuff:** compressed GBuff data. ([#412](https://github.com/Orillusion/orillusion/issues/412)) ([4649add](https://github.com/Orillusion/orillusion/commit/4649addc066cd53a5ee286940c1e254d64bde89e))
* **orbit:** pan at xz plane ([52383f5](https://github.com/Orillusion/orillusion/commit/52383f5c60da7f6f2e3407de6bda355946f61fed))
* **sample:** add camera path animation sample ([#385](https://github.com/Orillusion/orillusion/issues/385)) ([d447cd1](https://github.com/Orillusion/orillusion/commit/d447cd18e6e85763706e67c12e19d6a02e5e1dc4))
* **sample:** add EatTheBox sample,add ShootTheBox sample ([#391](https://github.com/Orillusion/orillusion/issues/391)) ([e925d1f](https://github.com/Orillusion/orillusion/commit/e925d1f743ade799dac9d33c01ad829bcef386cb))



## [0.7.2](https://github.com/Orillusion/orillusion/compare/v0.7.1...v0.7.2) (2024-01-26)


### Bug Fixes

* duplicated class name ([#341](https://github.com/Orillusion/orillusion/issues/341)) ([fe73994](https://github.com/Orillusion/orillusion/commit/fe73994063333feaff538285b82aefdd91ce02cf))
* Fix the error caused by removing the Sky Box. ([#344](https://github.com/Orillusion/orillusion/issues/344)) ([b02c85a](https://github.com/Orillusion/orillusion/commit/b02c85a6c4637f3a0fbe630dbd9d9a39065b01d8))
* Fix turning shadows on and off for Materials and MeshRenderers ([#343](https://github.com/Orillusion/orillusion/issues/343)) ([6858cc0](https://github.com/Orillusion/orillusion/commit/6858cc056a25c78e841d4c929ca36e09dd34e9fb))
* **gltfParser:** Fixed some model indices parsing errors ([#354](https://github.com/Orillusion/orillusion/issues/354)) ([9714d6e](https://github.com/Orillusion/orillusion/commit/9714d6e8d7bdf6bdd9357f78fd33cf9dbc520649))
* **media-extention:** fix get/set baseColor ([c6c5526](https://github.com/Orillusion/orillusion/commit/c6c5526cab00c21969e5d2b12ab358e487785edf))
* **physics:** fix new build with Ammo ([bba64a1](https://github.com/Orillusion/orillusion/commit/bba64a1ab35a89b712cd7dd6843118a331b01afe))
* Shadow of double side materials. ([#337](https://github.com/Orillusion/orillusion/issues/337)) ([e4004e7](https://github.com/Orillusion/orillusion/commit/e4004e747b4723db6f41636e997e662cb6343441))
* **shadow:** copy texture to texture error ([#339](https://github.com/Orillusion/orillusion/issues/339)) ([6fea86a](https://github.com/Orillusion/orillusion/commit/6fea86ae644b58d0d5a909a667e2b111d286632e))
* **SkeletonAnimation:** skeleton animation parser ([#353](https://github.com/Orillusion/orillusion/issues/353)) ([10ee99e](https://github.com/Orillusion/orillusion/commit/10ee99e4ebbc9b5c708c458c7d40bd93cb192375))


### Features

* **compute:** Add custom compute shader samples ([#336](https://github.com/Orillusion/orillusion/issues/336)) ([c4a7db1](https://github.com/Orillusion/orillusion/commit/c4a7db1a571529c97f550b4fe93d8dc74cf92f59))
* Renderer of Shape3D ([#360](https://github.com/Orillusion/orillusion/issues/360)) ([9f856bb](https://github.com/Orillusion/orillusion/commit/9f856bb069e7a121b319ebee6b2384984a37e230)), closes [#304](https://github.com/Orillusion/orillusion/issues/304) [#318](https://github.com/Orillusion/orillusion/issues/318)
* **sample:** add draw mesh line sample ([#331](https://github.com/Orillusion/orillusion/issues/331)) ([b7bf873](https://github.com/Orillusion/orillusion/commit/b7bf87362e6d9ad2d755ff22f462c71f2b2f18f1))
* **sample:** add moveble light sample ([#355](https://github.com/Orillusion/orillusion/issues/355)) ([b7f186b](https://github.com/Orillusion/orillusion/commit/b7f186ba6009fd702b8a5280dca1c15a00290d3e))
* **sample:** GUI text barrage ([#333](https://github.com/Orillusion/orillusion/issues/333)) ([ea2ed66](https://github.com/Orillusion/orillusion/commit/ea2ed6685f78c557cdd4447d4752f1a436ced20d))
* **shader:** add ComputeShader auto binding ([#359](https://github.com/Orillusion/orillusion/issues/359)) ([b0319d9](https://github.com/Orillusion/orillusion/commit/b0319d9138a2d09896f021044f84c069287bbbdd))
* **shader:** add logarithmic depth ([#346](https://github.com/Orillusion/orillusion/issues/346)) ([24afa9d](https://github.com/Orillusion/orillusion/commit/24afa9dea4da9e6a034303b965807cc8ccf4ee32))
* update @orillusion/ammo ([a926196](https://github.com/Orillusion/orillusion/commit/a926196edac77e99ff631b5b924ae7faa1fef22b))


### Performance Improvements

* **build:** use esnext as build target ([2fc6f27](https://github.com/Orillusion/orillusion/commit/2fc6f27d91ebdee871168cad2a723d76411cdfd3))
* Use pixelRatio from UIPanel. ([#338](https://github.com/Orillusion/orillusion/issues/338)) ([03529da](https://github.com/Orillusion/orillusion/commit/03529da3293da748d9f1a6183dab7ee902043bd3))



## [0.7.1](https://github.com/Orillusion/orillusion/compare/v0.7.0...v0.7.1) (2023-11-14)


### Bug Fixes

* Auto sort transparent renderers. ([#318](https://github.com/Orillusion/orillusion/issues/318)) ([5becdc4](https://github.com/Orillusion/orillusion/commit/5becdc48739e4ce7745d15a60c46612f991ae5f2))
* fix: load gltf sample
* fix: fix grass sample
* fix: fix media-extention material
* fix: fix post sample resize bug
* fix: fix csm shadow
* fix: Cancel automatic resizing of rendertexture in GI
* fix: Wrong offset for bloom
* fix: reduce texture sample times
* fix: texture Count Exceeded the maximum limit of 7

### Features
* **engine:** enable gpu attachments texture auto resize
* **graphic:** add new graphic samples
* **sample:** update physics car sample ([#327](https://github.com/Orillusion/orillusion/issues/327)) ([e09b243](https://github.com/Orillusion/orillusion/commit/e09b24386bb517d1277e00dcaa4105999d2dd856))



# [0.7.0](https://github.com/Orillusion/orillusion/compare/v0.6.9...v0.7.0) (2023-11-01)


### Bug Fixes

* Character loss during text layout. ([#317](https://github.com/Orillusion/orillusion/issues/317)) ([8ad7169](https://github.com/Orillusion/orillusion/commit/8ad71695df37ce3b21833773fe4c429817d2108c))
* fix gltf sample ([#321](https://github.com/Orillusion/orillusion/issues/321)) ([4ca35b5](https://github.com/Orillusion/orillusion/commit/4ca35b576454cb52aee47ddbc271a4d36a906e78))
* **particle:** add get baseMap ([e59bd9f](https://github.com/Orillusion/orillusion/commit/e59bd9f4d43e98941ef634aff5c4e525a02cc6f1))


### Features

* add graphic bath mesh ([#319](https://github.com/Orillusion/orillusion/issues/319)) ([7df4f95](https://github.com/Orillusion/orillusion/commit/7df4f95c9bfa85dc2aae121a64916121c2741988))
* **audio:** move audio to @orillusion/media-extension ([166d286](https://github.com/Orillusion/orillusion/commit/166d2866b3e427339082f6bbdc7d391d4b91e784))



## [0.6.9](https://github.com/Orillusion/orillusion/compare/v0.6.8...v0.6.9) (2023-09-06)

### Bug Fixes

* **webgpu:** fix latest WGSL error
* **canvas:** fix external canvas style ([#284](https://github.com/Orillusion/orillusion/issues/284)) ([bb89a68](https://github.com/Orillusion/orillusion/commit/bb89a68c3bd647a105c672ae8270a33ce6eae160)), closes [#283](https://github.com/Orillusion/orillusion/issues/283)
* fix renderer ([#281](https://github.com/Orillusion/orillusion/issues/281)) ([1f66ee8](https://github.com/Orillusion/orillusion/commit/1f66ee858eea3c19c11acf743b2cc6aa3be6ed37))
* **GUI:** UITransform will be updated correctly ([#288](https://github.com/Orillusion/orillusion/issues/288)) ([7a30945](https://github.com/Orillusion/orillusion/commit/7a30945c8af203d6d661f426c6493810c17a8154))
* **Octree:** Improve Octree's sample ([#289](https://github.com/Orillusion/orillusion/issues/289)) ([1321153](https://github.com/Orillusion/orillusion/commit/13211531b28b0ea881f106b44de3b2b48077ec6e))
* **component:** fix component life cycle ([b273ab4](https://github.com/Orillusion/orillusion/commit/b273ab4cbc7cdb377914d1ed3b188cc1751d1ff8))
* **particle:** fix particle material depth bug ([f3f1b20](https://github.com/Orillusion/orillusion/commit/f3f1b200043ccf5516002137bf68ac8d4c41a7de))
* **WorldPanel:** fix worldPanel depth compareFun ([592b643](https://github.com/Orillusion/orillusion/commit/592b64373d66c0054cfeb890c2a253b8d28ea73e))
* **bloom:** fix bloom uniform data offset ([39819ee](https://github.com/Orillusion/orillusion/commit/39819eed24fd01775885237d71e4814cb939c553))
* **gtao:*** Reduce threshold of dot gtao. ([494b827](https://github.com/Orillusion/orillusion/commit/494b8276561a782277b9106b7ca421a089506911))

### Features

* **wasm:** update matrix by WASM ([#292](https://github.com/Orillusion/orillusion/issues/292)) ([2c8e8ab](https://github.com/Orillusion/orillusion/commit/2c8e8ab5c44b8ae8499bb690c6789021e17aebb6))
* **csm:** add feature of Cascaded Shadow Map ([#286](https://github.com/Orillusion/orillusion/issues/286)) ([d798bd2](https://github.com/Orillusion/orillusion/commit/d798bd24002cc170881dd6daf1f3691ba112a3d2))
* **material:** use new material framework ([5111699](https://github.com/Orillusion/orillusion/commit/511169978ecd72aa213a644bc4f3614bc6807981))
* **pipelinePool:** add pipeline shader share ([c88b687](https://github.com/Orillusion/orillusion/commit/c88b6871e407b7e1025e2c07a8df9d6ef10631cf))
* add log z depth ([520b2bb](https://github.com/Orillusion/orillusion/commit/520b2bb7be1cf803e2b11c5f222ddd3d9667fd4a))
* add transform depth order ([bf40831](https://github.com/Orillusion/orillusion/commit/bf40831cb9637f7d7b18e4c4cf650ddb5c0b2e13))
* fadeout csm shadow far away ([bf30fe7](https://github.com/Orillusion/orillusion/commit/bf30fe71f6ccba71ebb3e3406f4f248d28e7615d))

### BREAKING CHANGES
* **material:** `MaterialBase` has beed renamed to `Material`, also need to implement `get/set` for `baseMap` for custom materials
* **shadow:** drop `shadowBias`, `shadowNear`, `shadowFar` options in shadow settings, values will be calculated automatically
* **Bloom:** add new `exposure` option in Bloom settings

## [0.6.8](https://github.com/Orillusion/orillusion/compare/v0.6.7...v0.6.8) (2023-08-10)

### Bug Fixes

* **entity:** change number children([#279](https://github.com/Orillusion/orillusion/issues/279)) ([f066490](https://github.com/Orillusion/orillusion/commit/f0664900f50cd610cc18d1d0bc17dd7884b376cf))
* **material:** fix uniformNode not update ([#268](https://github.com/Orillusion/orillusion/issues/268)) ([23db052](https://github.com/Orillusion/orillusion/commit/23db0524ba4ffb33a5d37586eeda03a23cf25b37))
* **hoverContoller:** opt maxDistance ([8cd1498](https://github.com/Orillusion/orillusion/commit/8cd14982b094e0ee90ca9c16696503e8327c6acf))
* **UniformNode:** Fix error of Uniform data(number) ([#276](https://github.com/Orillusion/orillusion/issues/276)) ([09266a6](https://github.com/Orillusion/orillusion/commit/09266a6c5e962ece97f1f67090b2ce07f43e753d))


### Features

* **godRay:** Add feature of GodRay post. ([#277](https://github.com/Orillusion/orillusion/issues/277)) ([1aa2a85](https://github.com/Orillusion/orillusion/commit/1aa2a855b2cc1b2d2abbbbc572014e584ef6c50a))
* **octree:** Use octree to Filter the scene tree ([#275](https://github.com/Orillusion/orillusion/issues/275)) ([f30a2ae](https://github.com/Orillusion/orillusion/commit/f30a2ae3b9e0aefa71cfe5c33a5aa86c948a895f))


## [0.6.7](https://github.com/Orillusion/orillusion/compare/v0.6.6...v0.6.7) (2023-07-28)

### Bug Fixes

* **engine:** Fixed a series of errors ([#255](https://github.com/Orillusion/orillusion/issues/255)) ([1b30982](https://github.com/Orillusion/orillusion/commit/1b30982659fda063057cada726a01d22e5d56830)) ([#264](https://github.com/Orillusion/orillusion/issues/264)) ([6ae06db](https://github.com/Orillusion/orillusion/commit/6ae06db0878066a3e146eddfcbc7e3b8554c5980)) ([#258](https://github.com/Orillusion/orillusion/issues/258)) ([e5153df](https://github.com/Orillusion/orillusion/commit/e5152df138456696547605f18b526b2ccc977fc4)) 
* **light:** fix light enable ([#266](https://github.com/Orillusion/orillusion/issues/266)) ([50429ea](https://github.com/Orillusion/orillusion/commit/50429eafcb6a10a3102795f8be40bf1b99a9dc43))
* **AtmosphericScattering:** fix sky Rendering error on Mac ([#254](https://github.com/Orillusion/orillusion/issues/254)) ([5b57016](https://github.com/Orillusion/orillusion/commit/5b57016f086868a410b7a4f6a61f74b5947d8909))

### Features

* **build:** add non-minified dist version ([acb1c7c](https://github.com/Orillusion/orillusion/commit/acb1c7c673a5c0f0fd018bb5410934f1b737ffdf))
* **samples:** new graphic/grass/terrain/drawcall/physics samples ([#265](https://github.com/Orillusion/orillusion/issues/265)) ([6e51c74](https://github.com/Orillusion/orillusion/commit/6e51c74f2b8371a20bce957cfdefe27fad8952ee)) ([#258](https://github.com/Orillusion/orillusion/issues/258)) ([e5153df](https://github.com/Orillusion/orillusion/commit/e5152df138456696547605f18b526b2ccc977fc4))
* **globalFog:** add feature of height fog ([#250](https://github.com/Orillusion/orillusion/issues/250)) ([e9e2f83](https://github.com/Orillusion/orillusion/commit/e9e2f830c0d6e6f9148313c5a2254a2a23718581))
* **grass:** add grass system ([#258](https://github.com/Orillusion/orillusion/issues/258)) ([e5153df](https://github.com/Orillusion/orillusion/commit/e5152df138456696547605f18b526b2ccc977fc4))
* **material:** add LambertMaterial ([#258](https://github.com/Orillusion/orillusion/issues/258)) ([e5153df](https://github.com/Orillusion/orillusion/commit/e5152df138456696547605f18b526b2ccc977fc4))
* **collider:** support MeshCollider ([#264](https://github.com/Orillusion/orillusion/issues/264)) ([6ae06db](https://github.com/Orillusion/orillusion/commit/6ae06db0878066a3e146eddfcbc7e3b8554c5980))


### Performance Improvements

* **BoundingBox:** add isBoundChange tag to Entity ([#257](https://github.com/Orillusion/orillusion/issues/257)) ([70ece43](https://github.com/Orillusion/orillusion/commit/70ece43d27afebbaee6e95d46666021afe6604c7))


## [0.6.6](https://github.com/Orillusion/orillusion/compare/v0.6.5...v0.6.6) (2023-06-28)

### Bug Fixes

* **collider:** Fix error of component deconstruction ([#236](https://github.com/Orillusion/orillusion/issues/236)) ([7b6d356](https://github.com/Orillusion/orillusion/commit/7b6d356ff50b32ee84ea1c041832166ff87a8225))
* **loader:** fix unnecessary copy [#233](https://github.com/Orillusion/orillusion/issues/233) ([#235](https://github.com/Orillusion/orillusion/issues/235)) ([7ad1581](https://github.com/Orillusion/orillusion/commit/7ad1581bc97bb8febed37338b6a1c4364c7e5099))
* **material:** Complete data for cloned shaders ([#226](https://github.com/Orillusion/orillusion/issues/226)) ([fb7aa97](https://github.com/Orillusion/orillusion/commit/fb7aa979b1fb3e7c75d44388d437529b0ddd9ff7))
* **Matrix4:** Fix matrix calculation error of lookAt ([#231](https://github.com/Orillusion/orillusion/issues/231)) ([a1617f6](https://github.com/Orillusion/orillusion/commit/a1617f6f0b5c6d48794dbefda1f10b8f66a636cb))
* **OrbitController:** limit zoom speed ([13608a8](https://github.com/Orillusion/orillusion/commit/13608a826d573f43c06af801ebb441b400d311d0))
* **skyLight:** change all AtmosphericComponent of samples ([#239](https://github.com/Orillusion/orillusion/issues/239)) ([2050e54](https://github.com/Orillusion/orillusion/commit/2050e5487510471796304ad84ccb5a642ac84810))


### Features

* **geometry:** Add extrude geometry feature ([#225](https://github.com/Orillusion/orillusion/issues/225)) ([1cb5d50](https://github.com/Orillusion/orillusion/commit/1cb5d504751937bbb8d2c45a6665baa8440c9fbb))
* **GUI:** New feature of scissor the GUI content. ([#219](https://github.com/Orillusion/orillusion/issues/219)) ([722abe1](https://github.com/Orillusion/orillusion/commit/722abe112dca85beaaa2c8dee76b38280bc175a4))
* **RelativeSky:** Relative sky to sunlight ([#237](https://github.com/Orillusion/orillusion/issues/237)) ([3664c8b](https://github.com/Orillusion/orillusion/commit/3664c8b3fe43690021b7653a8bec8dc2e927e79b))


### Performance Improvements

* **globalFog:** Optimize the fog effect to add fog color to the ambi… ([#223](https://github.com/Orillusion/orillusion/issues/223)) ([fab97a5](https://github.com/Orillusion/orillusion/commit/fab97a59b73bf01540e31b2c5c880dfa91f9b7cd))



## [0.6.5](https://github.com/Orillusion/orillusion/compare/v0.6.4...v0.6.5) (2023-06-12)

### Features

* **GI:** Add GI ([#215](https://github.com/Orillusion/orillusion/issues/215)) ([775ebbc](https://github.com/Orillusion/orillusion/commit/775ebbcee2ff801af931d2e626c8f4f5a4c5c09f))
* **GUI:** Add color transition mode to the UIButton ([#212](https://github.com/Orillusion/orillusion/issues/212)) ([56e5f03](https://github.com/Orillusion/orillusion/commit/56e5f034ea180c41cb6e97cb143e1822c497bdd1))


## [0.6.4](https://github.com/Orillusion/orillusion/compare/v0.6.3...v0.6.4) (2023-06-06)

### Bug Fixes

* **culling:** fix camera frustum culling ([#198](https://github.com/Orillusion/orillusion/issues/198)) ([8cfd1ab](https://github.com/Orillusion/orillusion/commit/8cfd1ab90401580a91c62f2249d30035df0e2aec))
* **GUI:** fix setImageType of ImageGroup ([#208](https://github.com/Orillusion/orillusion/issues/208)) ([ed4f248](https://github.com/Orillusion/orillusion/commit/ed4f248340c31be5c625f276ce8483115ffd8e30))
* **memory:** remove not use floatArray ([#201](https://github.com/Orillusion/orillusion/issues/201)) ([6ee2b2f](https://github.com/Orillusion/orillusion/commit/6ee2b2fe629cdc42722e34319d3131ea6ae945c0))


### Features

* **fog:** add fog sample ([#202](https://github.com/Orillusion/orillusion/issues/202)) ([27233d0](https://github.com/Orillusion/orillusion/commit/27233d0bfea4b780bbb18766ba62e4f37670eb61))
* **GUI:** add new GUI sample ([#206](https://github.com/Orillusion/orillusion/issues/206)) ([661a7f9](https://github.com/Orillusion/orillusion/commit/661a7f950b037549cdb379c16adaf893ee2aadb1))
* **particle:** Add GPU particle system ([#204](https://github.com/Orillusion/orillusion/issues/204)) ([1cc2567](https://github.com/Orillusion/orillusion/commit/1cc256720b95b2e34a6af702bf44c405ff7fe4ce))



## [0.6.3](https://github.com/Orillusion/orillusion/compare/v0.6.2...v0.6.3) (2023-05-30)

### Bug Fixes

* **android:** reslove webgpu errors ([#170](https://github.com/Orillusion/orillusion/issues/170)) ([a867ea7](https://github.com/Orillusion/orillusion/commit/a867ea7d6188f9b458189e2d5b6d8ea4e7d27a27))
* **blend:** fix blend mode ([#181](https://github.com/Orillusion/orillusion/issues/181)) ([e65cbb9](https://github.com/Orillusion/orillusion/commit/e65cbb9161a5947687f8b51972f416b542125dfd)) ([#178](https://github.com/Orillusion/orillusion/issues/178)) ([62ba7ce](https://github.com/Orillusion/orillusion/commit/62ba7cea188ff4f7d81a86505a554eebb6eee565))
* **canvas:** refine context3d init process ([#163](https://github.com/Orillusion/orillusion/issues/163)) ([8d7cde8](https://github.com/Orillusion/orillusion/commit/8d7cde8be4dc64acd5f4515ccd374f025966df7c))
* **ComponentCollect:** break component dependency for engine3D ([#161](https://github.com/Orillusion/orillusion/issues/161)) ([5c69be1](https://github.com/Orillusion/orillusion/commit/5c69be1f60edbb4c4ca9a9584554128e4182a95a))
* **destory:** fix object destory ([#164](https://github.com/Orillusion/orillusion/issues/164)) ([071ac16](https://github.com/Orillusion/orillusion/commit/071ac16d2eb82aa79a85244140a76d390543973a))
* **sky:** fix LDR skybox texture color ([#171](https://github.com/Orillusion/orillusion/issues/171)) ([9a89d2b](https://github.com/Orillusion/orillusion/commit/9a89d2b5058c7a3584106032a649faa1084c16ca))
* **sky:** fix AtmosphericSky color ([#179](https://github.com/Orillusion/orillusion/issues/179)) ([eb6ef48](https://github.com/Orillusion/orillusion/commit/eb6ef48cf3e8b4f183abba56b2e9aa1c5d777694))
* **light:** fix shader light position ([#175](https://github.com/Orillusion/orillusion/issues/175)) ([b2ba00f](https://github.com/Orillusion/orillusion/commit/b2ba00f6c95d2f1965aa8af7c7ab682f809c828b))
* **PropertyAnimation:** space conversion ([#162](https://github.com/Orillusion/orillusion/issues/162)) ([4dd34a3](https://github.com/Orillusion/orillusion/commit/4dd34a3a0bdacb39fcd0337c7fed9e759766b077))
* **renderOpt:** fix poor performance in handling shadow ([#143](https://github.com/Orillusion/orillusion/issues/143)) ([93d8a1c](https://github.com/Orillusion/orillusion/commit/93d8a1ce097102563ee67e0d016c499e4689ef19))
* **sample:** fix propertyAnimation. ([#173](https://github.com/Orillusion/orillusion/issues/173)) ([c35e838](https://github.com/Orillusion/orillusion/commit/c35e8383554f55c13bd73bdc2cb91b57e80ba3ce))
* **sample:** update shadowRameRate ([#132](https://github.com/Orillusion/orillusion/issues/132)) ([30e92d6](https://github.com/Orillusion/orillusion/commit/30e92d603b9d6bade008403a6abca47a3f6379fc))
* **shadow:** fix shadow cullmode ([#147](https://github.com/Orillusion/orillusion/issues/147)) ([2083b40](https://github.com/Orillusion/orillusion/commit/2083b40fd622d4baf4509e1819ff8dd25afd1e8d))


### Features

* **GUI:** add GUI feature ([#157](https://github.com/Orillusion/orillusion/issues/157)) ([016fdd9](https://github.com/Orillusion/orillusion/commit/016fdd9cb974f0c76e222b09cb2950c75bae32fb)) ([#166](https://github.com/Orillusion/orillusion/issues/166)) ([5caee15](https://github.com/Orillusion/orillusion/commit/5caee157365844b4a59d67237a725602df2755dc)) ([#172](https://github.com/Orillusion/orillusion/issues/172)) ([5c7c6ef](https://github.com/Orillusion/orillusion/commit/5c7c6ef1fd9642d578b109bdb9e740c52b892523)) ([#174](https://github.com/Orillusion/orillusion/issues/174)) ([58ad344](https://github.com/Orillusion/orillusion/commit/58ad3441d4ce6bb2a472a8232b37360d18b34f3d)) ([#182](https://github.com/Orillusion/orillusion/issues/182)) ([7797b86](https://github.com/Orillusion/orillusion/commit/7797b86d769565c7451e9b8707181c8addc463db))
* **sample:** add new POST samples ([#183](https://github.com/Orillusion/orillusion/issues/183)) ([328bf72](https://github.com/Orillusion/orillusion/commit/328bf7218a8f59b751b3f943ef4015b72e95a3f1))
* **sample:** add property animation sample ([#146](https://github.com/Orillusion/orillusion/issues/146)) ([8c0adf9](https://github.com/Orillusion/orillusion/commit/8c0adf904b9ab6f275b2bfa6d152d3452444abed))


## [0.6.2](https://github.com/Orillusion/orillusion/compare/v0.6.1...v0.6.2) (2023-05-15)

### Bug Fixes

* **bound:** fix bound test ([#131](https://github.com/Orillusion/orillusion/issues/131)) ([231b27e](https://github.com/Orillusion/orillusion/commit/231b27e4b6970322aa7f9ba751118686e8d79d1d))
* **destroy:** fix object destroy ([#142](https://github.com/Orillusion/orillusion/issues/142)) ([c9a0fc2](https://github.com/Orillusion/orillusion/commit/c9a0fc2a0c3ef1e01a18121a87cd29efae645f68))
* **geometry:** fix multi geometry ([#133](https://github.com/Orillusion/orillusion/issues/133)) ([20f649b](https://github.com/Orillusion/orillusion/commit/20f649b733cb5931127feb9e784f28e0fdf47f02))
* **HDRBloomPost:** add luminosityThreshold arg ([#106](https://github.com/Orillusion/orillusion/issues/106)) ([34ba5d9](https://github.com/Orillusion/orillusion/commit/34ba5d9631f21cfc353dda61ff47fbe649d9d5cf))
* **light:** fix light ies ([#109](https://github.com/Orillusion/orillusion/issues/109)) ([efc5f4d](https://github.com/Orillusion/orillusion/commit/efc5f4defa031963107fe679bf31b21903a82898))
* **light:** fix remove light ([#137](https://github.com/Orillusion/orillusion/issues/137)) ([da29404](https://github.com/Orillusion/orillusion/commit/da294049255815ac6a53c788ac7faaab28e99648))
* **renderOpt:** fix poor performance in handling shadow ([#143](https://github.com/Orillusion/orillusion/issues/143)) ([93d8a1c](https://github.com/Orillusion/orillusion/commit/93d8a1ce097102563ee67e0d016c499e4689ef19))
* **videoTexture:** force videoTexture refresh at rendering frameRate ([#119](https://github.com/Orillusion/orillusion/issues/119)) ([eeac1fc](https://github.com/Orillusion/orillusion/commit/eeac1fcde10711cd772138aabc35d8df2ce341ec))


### Features

* **destroy:** allow force destroy object ([#145](https://github.com/Orillusion/orillusion/issues/145))  ([91cb9d1](https://github.com/Orillusion/orillusion/commit/91cb9d1e628d3874e06f4997d3e38489a27dfcb2))
* **sample:** add physics samples ([#139](https://github.com/Orillusion/orillusion/issues/139)) ([422af0b](https://github.com/Orillusion/orillusion/commit/422af0b0e9dd8b56ed1491cb979d961b3f4ee515))
* **sample:** Add pick samples ([#124](https://github.com/Orillusion/orillusion/issues/124)) ([dbecd95](https://github.com/Orillusion/orillusion/commit/dbecd954a25af8eb08213f3f967f37d6bd6dc9c8))
* **sample:** add material samples ([#105](https://github.com/Orillusion/orillusion/issues/105)) ([f455f42](https://github.com/Orillusion/orillusion/commit/f455f42b27f3b8a2d1b98b6b3e7f8cd180cc549b))
* **sample:** add sample of geometry ([#116](https://github.com/Orillusion/orillusion/issues/116)) ([5eb40e6](https://github.com/Orillusion/orillusion/commit/5eb40e633e819829ba870c81caddfa5c30d684f8))
* **sample:** add sample of loader ([#114](https://github.com/Orillusion/orillusion/issues/114)) ([4745a5e](https://github.com/Orillusion/orillusion/commit/4745a5e1dbdd73b460cfb5ca358f95d472d93c68))
* **sample:** add samples of animation ([#115](https://github.com/Orillusion/orillusion/issues/115)) ([a68bb77](https://github.com/Orillusion/orillusion/commit/a68bb77f9f52094abad08148a3efe8f406f739ca))


## 0.6.1 (2023-05-07)

### Bug Fixes

* **Sample:** reslove sample errors ([#110](https://github.com/Orillusion/orillusion/issues/110)) ([e47e027](https://github.com/Orillusion/orillusion/commit/e47e027cfd27f61a6a0271732dc2bdc305806228))
* **HDRBloomPost:** add luminosityThreshold arg ([#106](https://github.com/Orillusion/orillusion/issues/106)) ([34ba5d9](https://github.com/Orillusion/orillusion/commit/34ba5d9631f21cfc353dda61ff47fbe649d9d5cf))
* **Light:** ies index not write ([#109](https://github.com/Orillusion/orillusion/issues/109)) ([efc5f4d](https://github.com/Orillusion/orillusion/commit/efc5f4defa031963107fe679bf31b21903a82898))
* **MatrixDO:** MatrixDO buffer ([#108](https://github.com/Orillusion/orillusion/issues/108)) ([5e6fcdb](https://github.com/Orillusion/orillusion/commit/5e6fcdbc1e980a4e7b99e9865753572cf3150cd9))

### Features

* **Sample:** add more samples - material, loader, render, sky ([#105](https://github.com/Orillusion/orillusion/issues/105)) ([f455f42](https://github.com/Orillusion/orillusion/commit/f455f42b27f3b8a2d1b98b6b3e7f8cd180cc549b))

### Breaking Changes
* **Scene3D:** deprecated `showSky`、`hideSky` and `exposure`


## 0.6.0 (2023-05-06)

### Bug Fixes

* **AtmosphericComponent:** fix AtmosphericComponent ([#99](https://github.com/Orillusion/orillusion/issues/99)) ([d70bba0](https://github.com/Orillusion/orillusion/commit/d70bba055f3f2043616d6c323ff9076be843a42e))
* **CI:** exit actions on test fail ([c6af5ed](https://github.com/Orillusion/orillusion/commit/c6af5ed54e397acff635d7472df5a24c2081f0ba))
* **CI:** enable ci on dev ([d839d02](https://github.com/Orillusion/orillusion/commit/d839d02298c5f69859e40850db10d9c49040714d))
* **Engine:** engine shadow lights collect init bug ([#102](https://github.com/Orillusion/orillusion/issues/102)) ([2055c45](https://github.com/Orillusion/orillusion/commit/2055c45a1f75e37697d5c28d5f959b5ac455d7c8))
* **Packages:** image&video material shader and skeleton animation event ([#100](https://github.com/Orillusion/orillusion/issues/100)) ([3a10b25](https://github.com/Orillusion/orillusion/commit/3a10b25f51c82766074ee877f273366aafdfc32b))
* **Math:** fix Matrix multiply function ([#88](https://github.com/Orillusion/orillusion/issues/88)) ([5b0bde3](https://github.com/Orillusion/orillusion/commit/5b0bde31e58625f52afa2652eaff4699cee77310))
* **chore:** fix autoindex on windows ([75ee2e0](https://github.com/Orillusion/orillusion/commit/75ee2e08ecf424e50bdc3df46f23b28c44c723e3))
* **chore:** update dependencies ([98307e6](https://github.com/Orillusion/orillusion/commit/98307e6fe2e939354e6d23310e91f6355e2a4f68))
* **chore:** update issue template ([2464ade](https://github.com/Orillusion/orillusion/commit/2464aded7d28b375b790de802a75efea229a3d9e))

### Features

* refector project src strcuture ([#13](https://github.com/Orillusion/orillusion/issues/13) ([b3647e0](https://github.com/Orillusion/orillusion/commit/b3647e03abff5381312203c19467a250de70efe9)) to [#104](https://github.com/Orillusion/orillusion/issues/104) ([5dff35c](https://github.com/Orillusion/orillusion/commit/5dff35cf5a945b9a238930b0553164fbcbaabc45)))
* add browser based unit/e2e tests
* auto indexing exports from /src ([#84](https://github.com/Orillusion/orillusion/issues/84)) ([a06ec3e](https://github.com/Orillusion/orillusion/commit/a06ec3e16af102446b20564c28443394475ed34c))
* enable github CI test ([3139051](https://github.com/Orillusion/orillusion/commit/3139051e2c7f91a5386f734ba14d29775a4c4677))

### Breaking Changes
* **View3D:** new `View3D`, add multi window support
* **Engine3D:** deprecated `Engine3D.startRender(ForwardRenderJob)`, replaced by `Engine3D.startRenderView(View3D)`
* **PostProcess:** new `PostProcessingComponent` to render all posteffect jobs
* **ComponetBase:** refactor lifecycle hooks, renamed `update` to `onUpdate`, deprecated `destory`
* **GUIHelp:** removed `GUIHelp` from core
* **AtmosphericComponent:** deprecated `AtmosphericScatteringSky`, replaced by `AtmosphericComponent`
