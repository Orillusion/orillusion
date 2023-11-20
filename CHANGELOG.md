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
