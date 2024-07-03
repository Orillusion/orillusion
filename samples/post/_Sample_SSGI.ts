import {
	View3D, DirectLight, Engine3D,
	PostProcessingComponent, LitMaterial, HoverCameraController,
	KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry,
	CameraUtil, webGPUContext, BoxGeometry, TAAPost, AtmosphericComponent, GTAOPost, Color, BloomPost, SSRPost, SSGIPost, GBufferPost, FXAAPost, SkyRenderer, Reflection, SphereReflection, GBufferFrame, ProfilerUtil, Time, SpotLight, Object3DUtil, Object3DTransformTools, PointLight, DepthOfFieldPost, OutlinePost
} from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats';
import { PhysicTransformController } from '@samples/physics/helps/components/PhysicTransformController';
import { GUIUtil } from '@samples/utils/GUIUtil';

export class Sample_SSGI {
	lightObj: Object3D;
	scene: Scene3D;
	view: View3D;

	async run() {
		Engine3D.setting.shadow.shadowSize = 2048
		Engine3D.setting.shadow.shadowBound = 175;
		Engine3D.setting.shadow.shadowBias = 0.0061;

		Engine3D.setting.shadow.shadowBound = 250;
		Engine3D.setting.shadow.shadowBias = 0.018;
		Engine3D.setting.render.useCompressGBuffer = true;

		Engine3D.setting.reflectionSetting.reflectionProbeMaxCount = 8;
		Engine3D.setting.reflectionSetting.reflectionProbeSize = 128;
		Engine3D.setting.reflectionSetting.enable = true;

		Engine3D.setting.render.hdrExposure = 1.0;

		GUIHelp.init();
		await Engine3D.init();

		this.scene = new Scene3D();
		// this.scene.addComponent(Stats);
		let sky = this.scene.addComponent(AtmosphericComponent);
		// let sky = this.scene.getOrAddComponent(SkyRenderer);
		// sky.map = await Engine3D.res.loadHDRTextureCube('/hdri/daytime2.hdr');
		// this.scene.envMap = sky.map;
		sky.exposure = 1.0;

		let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
		// mainCamera.enableCSM = true;
		mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
		let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
		ctrl.setCamera(-90, -25, 200);
		this.view = new View3D();
		this.view.scene = this.scene;
		this.view.camera = mainCamera;

		Object3DTransformTools.instance.active(this.scene);

		await this.initScene();
		sky.relativeTransform = this.lightObj.transform;

		Engine3D.startRenderView(this.view);

		let ssgi: SSGIPost;
		let postProcessing = this.scene.addComponent(PostProcessingComponent);
		postProcessing.addPost(FXAAPost);

		// ** test pass 
		// let TAA = postProcessing.addPost(TAAPost);
		let gtao = postProcessing.addPost(GTAOPost);
		GUIUtil.renderGTAO(gtao);
		let gBufferPost = postProcessing.addPost(GBufferPost);
		GUIUtil.renderGBufferPost(gBufferPost);
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

		GUIUtil.renderShadowSetting();
		let f = GUIHelp.addFolder("SSGI");
		f.open();
		GUIHelp.add(Engine3D.setting.sky, 'skyExposure', 0.0, 5.0, 0.0001);
		GUIHelp.add(Engine3D.setting.render, 'hdrExposure', 0.0, 5.0, 0.0001);
		GUIHelp.endFolder();
	}

	async initScene() {
		{
			this.lightObj = new Object3D();
			this.lightObj.rotationX = 45;
			this.lightObj.rotationY = 110;
			this.lightObj.rotationZ = 0;

			this.lightObj.rotationX = 44.56;
			this.lightObj.rotationY = 112.8;
			this.lightObj.rotationZ = 0;
			let lc = this.lightObj.addComponent(DirectLight);
			lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
			lc.castShadow = true;
			lc.intensity = 4
			lc.indirect = 0.1;
			this.scene.addChild(this.lightObj);
			GUIUtil.renderDirLight(lc);

			// let spotObj = new Object3D();
			// spotObj.addChild(Object3DUtil.GetCube());
			// let l = spotObj.addComponent(SpotLight);
			// l.castShadow = true;
			// this.scene.addChild(spotObj);
			// GUIUtil.showSpotLightGUI(l);

			// spotObj.x = -652.02;
			// spotObj.y = 291.67;
			// spotObj.z = -225.11;

			// spotObj.rotationX = -8.24;
			// spotObj.rotationY = 48.38;
			// spotObj.rotationZ = 0;

			// l.lightColor = new Color().copyFromArray([147, 101, 101, 255]);

			// l.intensity = 3;
			// l.range = 1000;
			// l.outerAngle = 114;

			// let pointObj = new Object3D();
			// pointObj.addChild(Object3DUtil.GetCube());
			// let pl = pointObj.addComponent(PointLight);
			// pl.castShadow = true;
			// this.scene.addChild(pointObj);

			// pointObj.x = -652.02;
			// pointObj.y = 291.67;
			// pointObj.z = -225.11;

			// pl.lightColor = new Color().copyFromArray([147, 101, 101, 255]);

			// pl.intensity = 3;
			// pl.range = 1000;
			// GUIUtil.showPointLightGUI(pl);
		}

		// let giScene = await Engine3D.res.loadGltf("live/Archive/pxd.gltf");
		// let giScene = await Engine3D.res.loadGltf("live/Archive/live.glb");
		// let giScene = await Engine3D.res.loadGltf("live/Archive/live2.glb");
		// let giScene = await Engine3D.res.loadGltf("gi/GITest.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/wukong/wukong.gltf");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_001.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_002.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_003.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_004.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_005.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Ground_Grass_01.glb");

		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/frazer-nash.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/Example_Streets.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/Corridor_Gardens_Pergola01.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Statue_09.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Statue_08.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Female_Bust_Statuette_01a.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Old_Wooden_Figurine_01a.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Art_01c.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Art_01b.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Geode_01a.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_F_Display_Stand_01a.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_006.glb");
		let giScene = await Engine3D.res.loadGltf("gltfs/dt/DingLeiChangFang.gltf");

		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/ue5_007.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/Corridor_Gardens_FountainPool01.gltf");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/cim.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/pbrCar/car.gltf");
		giScene.forChild((child: Object3D) => {
			let mr = child.getComponent(MeshRenderer);
			if (mr) {
				let mat = mr.material;
				if (mat instanceof LitMaterial) {
					GUIUtil.renderLitMaterial(mat);
				}
			}
		});

		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Platform_01d.glb");
		// let giScene = await Engine3D.res.loadGltf("gltfs/scene/SM_Outfit_01d.glb");

		// let ab = giScene.getChildByName("SM_Outfit_01d1") as Object3D;
		// let abMR = ab.getComponent(MeshRenderer);
		// let mat = abMR.material;
		// GUIUtil.renderLitMaterial(mat as LitMaterial);

		// let ab = giScene.getChildByName("SM_Water_Pot_01a1") as Object3D;
		// let abMR = (ab.entityChildren[0] as Object3D).getComponent(MeshRenderer);
		// let mat = abMR.material;
		// GUIUtil.renderLitMaterial(mat as LitMaterial);

		//Demonstration
		giScene.scaleX = 10;
		giScene.scaleY = 10;
		giScene.scaleZ = 10;
		this.scene.addChild(giScene);

		let ab = giScene.getChildByName("BP_Car_Circle_01a") as Object3D;
		if (ab) {
			setInterval(() => {
				ab.rotationY += Time.delta * 0.001 * 1;
			}, 16);
		}


		let space = 100;
		let ii = 0;
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 2; j++) {
				let reflection = new Object3D();
				let ref = reflection.addComponent(SphereReflection);
				reflection.x = i * space - space * 0.5;
				reflection.y = 10;
				reflection.z = j * space - space * 0.5;
				ref.debug(ii++, 0.1);
				this.scene.addChild(reflection);
			}
		}

		{
			let emiss = Object3DUtil.GetCube();
			let mr = emiss.getComponent(MeshRenderer);
			let mat = mr.material as LitMaterial;
			// mat.emissiveColor = new Color(0.2, 0.2, 0.8);
			// mat.emissiveIntensity = 1.5;

			emiss.scaleX = 10;
			emiss.scaleY = 10;
			emiss.scaleZ = 10;
			this.scene.addChild(emiss);
		}
	}
}

