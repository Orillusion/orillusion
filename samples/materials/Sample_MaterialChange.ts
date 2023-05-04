import { VideoMaterial } from "@orillusion/media-extention/VideoMaterial";
import { VideoTexture } from "@orillusion/media-extention/VideoTexture";
import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, Object3D, MeshRenderer, UnLitMaterial, ColliderComponent, PointerEvent3D, LitMaterial, PlaneGeometry, Vector3 } from "@orillusion/core";

export class Sample_MaterialChange {
    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;

        await Engine3D.init({ canvasConfig: { alpha: false, zIndex: 0 } });


        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        let hover = camera.object3D.addComponent(HoverCameraController);
        hover.setCamera(0, 0, 20);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);

        await this.initScene2(scene);
    }

    async initScene2(scene: Scene3D) {
        let monitor = await Engine3D.res.loadGltf('gltfs/monitor/scene.gltf');
        scene.addChild(monitor);

        let screen = monitor.getChildByName('Screen') as Object3D;
        let mr = screen.getComponentsInChild(MeshRenderer)[0];

        let videoTexture = new VideoTexture();
        await videoTexture.load('/video/dt.mp4');

        let texture1 = await Engine3D.res.loadTexture('textures/diffuse.jpg');
        let texture2 = await Engine3D.res.loadTexture('textures/normal.jpg');

        let videoMat = new VideoMaterial();
        videoMat.baseMap = videoTexture;

        // let mat = new LitMaterial();
        let mat = new UnLitMaterial();

        mr.object3D.addComponent(ColliderComponent);
        mr.object3D.addEventListener(PointerEvent3D.PICK_DOWN, (e: PointerEvent3D) => {
            if (mr.material == mat) {
                mr.material = videoMat;
            } else {
                mr.material = mat;
            }
        }, this);
    }

    async initScene(scene: Scene3D) {
        let mat = new LitMaterial();

        let videoTexture = new VideoTexture();
        await videoTexture.load('/video/dt.mp4')

        let videoMat = new VideoMaterial();
        videoMat.baseMap = videoTexture;

        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.material = mat;
        mr.geometry = new PlaneGeometry(10, 10, 1, 1, Vector3.Z_AXIS);
        scene.addChild(plane);
    }
}
