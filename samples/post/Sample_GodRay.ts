import {
	View3D, DirectLight, Engine3D,
	PostProcessingComponent, LitMaterial, HoverCameraController,
	KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry,
	CameraUtil, webGPUContext, BoxGeometry, AtmosphericComponent, Time, GodRayPost, BloomPost
} from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { GUIUtil } from '@samples/utils/GUIUtil';

class Sample_GodRay {
	lightObj: Object3D;
	scene: Scene3D;

	async run() {
		Engine3D.setting.shadow.shadowSize = 1024;
		Engine3D.setting.shadow.shadowBound = 400;

		await Engine3D.init({ renderLoop: () => { this.loop() } });

		this.scene = new Scene3D();
		let sky = this.scene.addComponent(AtmosphericComponent);
		GUIHelp.init();

		let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
		mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
		let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
		ctrl.setCamera(110, -10, 300);
		await this.initScene();

		sky.relativeTransform = this.lightObj.transform;

		let view = new View3D();
		view.scene = this.scene;
		view.camera = mainCamera;
		mainCamera.enableCSM = true;
		Engine3D.startRenderView(view);

		let postProcessing = this.scene.addComponent(PostProcessingComponent);
		let godRay = postProcessing.addPost(GodRayPost);
		postProcessing.addPost(BloomPost);

		GUIUtil.renderAtmosphericSky(sky, false);
		GUIUtil.renderGodRay(godRay);
	}
	async initScene() {
		{
			this.lightObj = new Object3D();
			this.lightObj.rotationX = 15;
			this.lightObj.rotationY = 110;
			this.lightObj.rotationZ = 0;
			let lc = this.lightObj.addComponent(DirectLight);
			lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
			lc.castShadow = true;
			lc.intensity = 20;
			this.scene.addChild(this.lightObj);
			GUIUtil.renderDirLight(lc, false);
		}

		{
			let mat = new LitMaterial();
			mat.roughness = 0.5;
			mat.metallic = 0.2;
			let floor = new Object3D();
			let mr = floor.addComponent(MeshRenderer);
			mr.geometry = new PlaneGeometry(2000, 2000);
			mr.material = mat;
			this.scene.addChild(floor);
		}

		this.createPlane(this.scene);
	}

	private ball: Object3D;
	private createPlane(scene: Scene3D) {
		let mat = new LitMaterial();
		mat.roughness = 0.5;
		mat.metallic = 0.2;
		{
			let sphereGeometry = new SphereGeometry(20, 50, 50);
			let obj: Object3D = new Object3D();
			let mr = obj.addComponent(MeshRenderer);
			mr.material = mat;
			mr.geometry = sphereGeometry;
			obj.x = 10;
			obj.y = 20;
			scene.addChild(obj);
			this.ball = obj;
		}

		const length = 5;
		for (let i = 0; i < length; i++) {
			let cubeGeometry = new BoxGeometry(10, 160, 10);
			for (let j = 0; j < length; j++) {
				let obj: Object3D = new Object3D();
				let mr = obj.addComponent(MeshRenderer);
				mr.material = mat;
				mr.geometry = cubeGeometry;
				obj.localScale = obj.localScale;
				obj.x = (i - 2.5) * 40;
				obj.z = (j - 2.5) * 40;
				obj.y = 60;
				obj.rotationX = (Math.random() - 0.5) * 80;
				obj.rotationY = (Math.random() - 0.5) * 90;
				scene.addChild(obj);
			}
		}
	}
	private loop() {
		if (this.ball) {
			let position = this.ball.localPosition;
			let angle = Time.time * 0.001;
			position.x = Math.sin(angle) * 40;
			position.z = Math.cos(angle) * 40;
			position.y = 80;
			this.ball.localPosition = position;
		}
	}

}

new Sample_GodRay().run();
