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
