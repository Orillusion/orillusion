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
