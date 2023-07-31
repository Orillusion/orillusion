import {
	View3D, DirectLight, Engine3D,
	PostProcessingComponent, LitMaterial, HoverCameraController,
	KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry,
	CameraUtil, webGPUContext, BoxGeometry, TAAPost, AtmosphericComponent, GTAOPost, Color, HDRBloomPost
} from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';

class Sample_Bloom {
	lightObj: Object3D;
	scene: Scene3D;

	async run() {
		Engine3D.setting.shadow.shadowSize = 2048
		Engine3D.setting.shadow.shadowBound = 500;
		Engine3D.setting.shadow.shadowBias = 0.0002;

		await Engine3D.init();

		this.scene = new Scene3D();
		let sky = this.scene.addComponent(AtmosphericComponent);
		sky.sunY = 0.6;

		let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
		mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
		let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
		ctrl.setCamera(0, -15, 500);
		await this.initScene();
		sky.relativeTransform = this.lightObj.transform;


		let view = new View3D();
		view.scene = this.scene;
		view.camera = mainCamera;
		Engine3D.startRenderView(view);

		let postProcessing = this.scene.addComponent(PostProcessingComponent);
		let post = postProcessing.addPost(HDRBloomPost);
		post.blurX = 4;
		post.blurY = 4;
		post.luminosityThreshold = 1.5;
		post.strength = 4.0;
		this.gui();
	}

	async initScene() {
		{
			this.lightObj = new Object3D();
			this.lightObj.rotationX = 45;
			this.lightObj.rotationY = 110;
			this.lightObj.rotationZ = 0;
			let lc = this.lightObj.addComponent(DirectLight);
			lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
			lc.castShadow = true;
			lc.intensity = 10;
			this.scene.addChild(this.lightObj);
		}

		{
			let mat = new LitMaterial();
			mat.baseMap = Engine3D.res.grayTexture;
			mat.normalMap = Engine3D.res.normalTexture;
			mat.aoMap = Engine3D.res.whiteTexture;
			mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
			mat.emissiveMap = Engine3D.res.blackTexture;
			mat.roughness = 1.5;
			mat.metallic = 0.0;

			let floor = new Object3D();
			let mr = floor.addComponent(MeshRenderer);
			mr.geometry = new PlaneGeometry(400, 400);
			mr.material = mat;
			this.scene.addChild(floor);

			{
				let wall = new Object3D();
				let mr = wall.addComponent(MeshRenderer);
				mr.geometry = new BoxGeometry(5, 260, 320);
				mr.material = mat;
				wall.x = -320 * 0.5;
				this.scene.addChild(wall);
			}

			{
				let wall = new Object3D();
				let mr = wall.addComponent(MeshRenderer);
				mr.geometry = new BoxGeometry(5, 260, 320);
				mr.material = mat;
				wall.x = 320 * 0.5;
				this.scene.addChild(wall);
			}

			{
				let wall = new Object3D();
				let mr = wall.addComponent(MeshRenderer);
				mr.geometry = new BoxGeometry(320, 260, 5);
				mr.material = mat;
				wall.z = -320 * 0.5;
				this.scene.addChild(wall);
			}

			{
				{
					let litMat = new LitMaterial();
					litMat.emissiveMap = Engine3D.res.whiteTexture;
					litMat.emissiveColor = new Color(0.0, 0.0, 1.0);
					litMat.emissiveIntensity = 5.0;
					let sp = new Object3D();
					let mr = sp.addComponent(MeshRenderer);
					mr.geometry = new SphereGeometry(15, 30, 30);
					mr.material = litMat;
					sp.x = 68;
					sp.y = 15;
					sp.z = -15;
					this.scene.addChild(sp);
				}

				{
					let litMat = new LitMaterial();
					litMat.emissiveMap = Engine3D.res.whiteTexture;
					litMat.emissiveColor = new Color(1.0, 1.0, 0.0);
					litMat.emissiveIntensity = 5;
					let sp = new Object3D();
					let mr = sp.addComponent(MeshRenderer);
					mr.geometry = new SphereGeometry(15, 30, 30);
					mr.material = litMat;
					sp.x = 1;
					sp.y = 15;
					sp.z = -8;
					this.scene.addChild(sp);
				}
			}
		}
	}

	private gui() {
		GUIHelp.init();
		let postProcessing = this.scene.getComponent(PostProcessingComponent);
		let post = postProcessing.getPost(HDRBloomPost);

		GUIHelp.addFolder("Bloom");
		GUIHelp.add(post, "blurX", 0.0, 5, 1);
		GUIHelp.add(post, "blurY", 0.0, 5, 1);
		GUIHelp.add(post, "radius", 0.0, 5, 1);
		GUIHelp.add(post, "luminosityThreshold", 0.0, 5, 0.001);
		GUIHelp.add(post, "strength", 0.0, 10, 0.001);
		GUIHelp.endFolder();
	}

}

new Sample_Bloom().run();
