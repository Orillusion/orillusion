import { Scene3D, Engine3D, BoxGeometry, LitMaterial, MeshRenderer, Object3D, PropertyAnimClip, PropertyAnimation, WrapMode } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";

// Sample to load json file
export class Sample_LoadJson {
    scene: Scene3D;

    async run() {
        await Engine3D.init();
        let param = createSceneParam();
        param.camera.distance = 10;
        let exampleScene = createExampleScene(param);

        this.scene = exampleScene.scene;
        Engine3D.startRenderView(exampleScene.view);

        let json = await Engine3D.res.loadJSON('json/anim_0.json', { onProgress: this.onLoadProgress, onComplete: this.onComplete });
        console.log('[loaded]', json);

        let box = new Object3D()
        let mr = box.addComponent(MeshRenderer);
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
