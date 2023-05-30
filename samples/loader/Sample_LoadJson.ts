import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, View3D, Object3D, MeshRenderer, BoxGeometry, LitMaterial, PropertyAnimation, PropertyAnimClip, WrapMode, HoverCameraController } from "@orillusion/core";
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
        camera.object3D.addComponent(HoverCameraController).setCamera(25, -15, 10);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        let json = await Engine3D.res.loadJSON('json/anim_0.json', { onProgress: this.onLoadProgress, onComplete: this.onComplete });
        console.log('[loaded]', json);

        let box = new Object3D()
        let mr = box.addComponent(MeshRenderer)
        mr.geometry = new BoxGeometry()
        mr.material = new LitMaterial()
        this.scene.addChild(box)

        // play animation clip from json
        let animation = box.addComponent(PropertyAnimation)
        let animClip = new PropertyAnimClip();
        animClip.parse(json);
        animClip.wrapMode = WrapMode.Loop;
        animation.defaultClip = animClip.name;
        animation.autoPlay = true;
        animation.appendClip(animClip);
    }

    onLoadProgress(received, total, url) {
        console.log('[progress]', received, total, url);
    }

    onComplete(url) {
        console.log('[complete]', url);
    }

}
