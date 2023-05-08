import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, View3D } from "@orillusion/core";

// Sample to load json file
export class Sample_LoadJson {
    scene: Scene3D;

    async run() {
        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 1, 5000.0);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        let json = await Engine3D.res.loadJSON('json/anim.json', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) });
        console.log('json file loaded');
        console.log(json);
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

}
