import {
	View3D, DirectLight, Engine3D,
	PostProcessingComponent, LitMaterial, HoverCameraController,
	KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry,
	CameraUtil, webGPUContext, BoxGeometry, TAAPost, AtmosphericComponent, GTAOPost, Color, BloomPost, SSRPost, SSGIPost, GBufferPost, FXAAPost, SkyRenderer, Reflection, SphereReflection, GBufferFrame, ProfilerUtil, Time, SpotLight, Object3DUtil, Object3DTransformTools, PointLight, DepthOfFieldPost, OutlinePost, Material, Vector3
} from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { GUIUtil } from '@samples/utils/GUIUtil';

export class Sample_CarPaint {
	lightObj: Object3D;
	scene: Scene3D;
	view: View3D;

	async run() {
		Engine3D.setting.shadow.shadowSize = 2048
		Engine3D.setting.shadow.shadowBound = 175;
		Engine3D.setting.shadow.shadowBias = 0.0061;

		Engine3D.setting.shadow.shadowBound = 550;
		Engine3D.setting.shadow.shadowBias = 0.018;
		Engine3D.setting.render.useCompressGBuffer = true;

		Engine3D.setting.reflectionSetting.reflectionProbeMaxCount = 8;
		Engine3D.setting.reflectionSetting.reflectionProbeSize = 128;
		Engine3D.setting.reflectionSetting.enable = true;

		Engine3D.setting.render.hdrExposure = 1.0;

		GUIHelp.init();
		await Engine3D.init();

		this.scene = new Scene3D();
		let sky = this.scene.getOrAddComponent(SkyRenderer);
		sky.map = await Engine3D.res.loadTextureCubeStd('sky/LDR_sky.jpg');
		sky.exposure = 1.0;
		sky.useSkyReflection();
		// sky.enable = false;

		let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
		mainCamera.perspective(60, webGPUContext.aspect, 1, 8000.0);
		let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
		ctrl.setCamera(-90, -25, 1200);
		this.view = new View3D();
		this.view.scene = this.scene;
		this.view.camera = mainCamera;

		Object3DTransformTools.instance.active(this.scene);

		await this.initScene();

		Engine3D.startRenderView(this.view);

		let ssgi: SSGIPost;
		let postProcessing = this.scene.addComponent(PostProcessingComponent);
		postProcessing.addPost(FXAAPost);

		// ** test pass 
		// let TAA = postProcessing.addPost(TAAPost);
		// let gtao = postProcessing.addPost(GTAOPost);
		// GUIUtil.renderGTAO(gtao);
		// let gBufferPost = postProcessing.addPost(GBufferPost);
		// GUIUtil.renderGBufferPost(gBufferPost);
		// let bloom = postProcessing.addPost(BloomPost);
		// GUIUtil.renderBloom(bloom);

		// let taa = postProcessing.addPost(TAAPost);
		// GUIUtil.renderTAA(taa);
		// let depth = postProcessing.addPost(DepthOfFieldPost);
		// GUIUtil.renderDepthOfField(depth);
		// ** test pass 
		// let post = postProcessing.addPost(OutlinePost);
		// GUIUtil.renderOutlinePost(post);

		// ** test pass 
		// let ssrt = postProcessing.addPost(SSRPost);
		// ssgi = postProcessing.addPost(SSGIPost);
		// GUIUtil.renderDirLight(this.lightObj.getComponent(DirectLight));
		GUIUtil.renderProfiler(ProfilerUtil.viewCount(this.view));
		GUIUtil.renderShadowSetting();
		let f = GUIHelp.addFolder("SSGI");
		f.open();
		GUIHelp.add(Engine3D.setting.sky, 'skyExposure', 0.0, 5.0, 0.0001);
		GUIHelp.add(Engine3D.setting.render, 'hdrExposure', 0.0, 5.0, 0.0001);
		GUIHelp.endFolder();
	}

	async initScene() {
		{
			// this.lightObj = new Object3D();
			// this.lightObj.rotationX = 45;
			// this.lightObj.rotationY = 110;
			// this.lightObj.rotationZ = 0;

			// this.lightObj.rotationX = 44.56;
			// this.lightObj.rotationY = 112.8;
			// this.lightObj.rotationZ = 0;
			// let lc = this.lightObj.addComponent(DirectLight);
			// lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
			// lc.castShadow = true;
			// lc.intensity = 15;
			// lc.indirect = 0.1;
			// this.scene.addChild(this.lightObj);
			// GUIUtil.renderDirLight(lc);
		}

		{
			// let reflection = new Object3D();
			// let ref = reflection.addComponent(SphereReflection);
			// ref.autoUpdate = true;
			// // ref.debug(0, 5);
			// reflection.x = 0;
			// reflection.y = 300;
			// reflection.z = 0;
			// this.scene.addChild(reflection);
			// GUIUtil.renderTransform(reflection.transform);
		}

		{
			let pl = Object3DUtil.GetPointLight(
				new Vector3(0, 300, 0),
				new Vector3(0, 0, 0),
				2590,
				1,
				1,
				1,
				1500,
				true
			);
			this.scene.addChild(pl.object3D);
			GUIUtil.showPointLightGUI(pl);
		}

		// let giScene = await Engine3D.res.loadGltf("gltfs/pbrCar/car.gltf");
		let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_006.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/测试汽车1.gltf");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/测试汽车.glb");

		let i = 0;
		let cacheMat = new Map<string, Material>();
		giScene.forChild((child: Object3D) => {
			let mr = child.getComponent(MeshRenderer);
			if (mr) {
				let mat = mr.material;
				mat.doubleSide = true;

				if (mat instanceof LitMaterial) {
					let has = mat.shader.hasDefine('USE_CLEARCOAT');
					// if (has && !cacheMat.has(mat.name) && mat.name.includes("白色")) {
					// 	GUIUtil.renderLitMaterial(mat);
					// 	cacheMat.set(mat.name, mat);
					// }

					if (has && !cacheMat.has(mat.name)) {
						GUIUtil.renderLitMaterial(mat);
						cacheMat.set(mat.name, mat);
					} else {
						// if (i < 1)
						// mr.enable = false;
						// 	this.view.graphic3D.drawMeshWireframe(child.name + i++, mr.geometry, mr.transform);
					}
				}
			}
		});

		//Demonstration
		giScene.scaleX = 100;
		giScene.scaleY = 100;
		giScene.scaleZ = 100;
		this.scene.addChild(giScene);
	}
}

