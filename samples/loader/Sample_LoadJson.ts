import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, View3D } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

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

        let json = await Engine3D.res.loadJSON('json/anim.json', { onProgress: this.onLoadProgress, onComplete: this.onComplete });
        console.log('[loaded]', json);
    }

    onLoadProgress(received, total, url) {
        console.log('[progress]', received, total, url);
    }

    onComplete(url) {
        console.log('[complete]', url);
    }

}
