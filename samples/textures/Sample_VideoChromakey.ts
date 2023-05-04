import { Engine3D, Scene3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, Object3D, MeshRenderer, PlaneGeometry, Vector3 } from "@orillusion/core";
import { ChromaKeyMaterial } from '@orillusion/media-extention/ChromaKeyMaterial';
import { VideoTexture } from "@orillusion/media-extention/VideoTexture";
export class Sample_VideoChromakey {
    async run() {
        await Engine3D.init({
            canvasConfig: {
                alpha: true,
                backgroundImage: '/logo/bg.webp'
            }
        });



        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.hideSky();
        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, webGPUContext.aspect, 0.01, 5000.0);

        let hover = camera.object3D.addComponent(HoverCameraController);
        hover.setCamera(0, 0, 150);

        await this.initScene(scene);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;


        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        // const stream = await navigator.mediaDevices.getUserMedia({
        //     audio: false,
        //     video: {
        //         width: 1280,
        //         height: 720
        //     }
        // })
        let videoTexture = new VideoTexture();
        await videoTexture.load('/video/chicken.mp4')

        let chromakeyMat = new ChromaKeyMaterial();
        chromakeyMat.baseMap = videoTexture;
        chromakeyMat.despoil = 0.35;
        chromakeyMat.debug();

        let plane = new Object3D();
        let mr = plane.addComponent(MeshRenderer);
        mr.material = chromakeyMat;
        mr.geometry = new PlaneGeometry(96.0, 54.0, 1, 1, Vector3.Z_AXIS);
        scene.addChild(plane);
    }
}
