import {
	View3D, DirectLight, Engine3D,
	PostProcessingComponent, LitMaterial, HoverCameraController,
	KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry,
	CameraUtil, webGPUContext, BoxGeometry, TAAPost, AtmosphericComponent, GTAOPost
} from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';

class Sample_GTAO {
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
		let post = postProcessing.addPost(GTAOPost);
		post.maxDistance = 60;
		this.gui();
	}

	async initScene() {
		{
			this.lightObj = new Object3D();
			this.lightObj.rotationX = 20;
			this.lightObj.rotationY = 110;
			this.lightObj.rotationZ = 0;
			let lc = this.lightObj.addComponent(DirectLight);
			lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
			lc.castShadow = true;
			lc.intensity = 30;
			this.scene.addChild(this.lightObj);
		}

		{
			let mat = new LitMaterial();
			mat.baseMap = Engine3D.res.grayTexture;
			mat.normalMap = Engine3D.res.normalTexture;
			mat.aoMap = Engine3D.res.whiteTexture;
			mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
			mat.emissiveMap = Engine3D.res.blackTexture;
			mat.roughness = 1.0;
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
					let sp = new Object3D();
					let mr = sp.addComponent(MeshRenderer);
					mr.geometry = new SphereGeometry(50, 30, 30);
					mr.material = mat;
					this.scene.addChild(sp);
				}
			}
		}
	}

	private gui() {
		GUIHelp.init();
		let postProcessing = this.scene.getComponent(PostProcessingComponent);
		let post = postProcessing.getPost(GTAOPost);

		GUIHelp.addFolder("GTAO");
		GUIHelp.add(post, "maxDistance", 0.0, 50, 1);
		GUIHelp.add(post, "maxPixel", 0.0, 50, 1);
		GUIHelp.add(post, "rayMarchSegment", 0.0, 50, 0.001);
		GUIHelp.add(post, "darkFactor", 0.0, 5, 0.001);
		GUIHelp.add(post, "blendColor");
		GUIHelp.add(post, "multiBounce");
		GUIHelp.endFolder();
	}

}

new Sample_GTAO().run();
