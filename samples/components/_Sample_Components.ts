import { Object3D, Camera3D, Scene3D, View3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext } from "@orillusion/core";

export class Sample_Components {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    view: View3D;

    constructor() { }

    async run() {
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        // this.hover = camera.object3D.addComponent(HoverCameraController);

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;


        Engine3D.startRenderView(this.view);

        this.init();
    }

    init() {

    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

    renderUpdate() { }
}
