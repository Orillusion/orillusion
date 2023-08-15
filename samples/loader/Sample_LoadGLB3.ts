import { Engine3D, LitMaterial, MeshRenderer, Object3D, PlaneGeometry, Scene3D } from "@orillusion/core";
import { createExampleScene } from "@samples/utils/ExampleScene";

// Sample to load glb file
export class Sample_LoadGLB3 {
    scene: Scene3D;

    async run() {
        await Engine3D.init();
        Engine3D.setting.shadow.autoUpdate = true;
        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;

        exampleScene.hoverCtrl.setCamera(-45, -45, 10);
        exampleScene.light.intensity = 10;
        Engine3D.startRenderView(exampleScene.view);
        await this.initScene();
    }

    async initScene() {
        /******** floor *******/
        // {
        //     let mat = new LitMaterial();
        //     mat.baseMap = Engine3D.res.whiteTexture;
        //     mat.roughness = 0.85;
        //     mat.metallic = 0.1;
        //     let floor = new Object3D();
        //     let mr = floor.addComponent(MeshRenderer);
        //     mr.geometry = new PlaneGeometry(200, 200);
        //     mr.material = mat;
        //     this.scene.addChild(floor);
        // }

        /******** load glb file *******/
        let model = (await Engine3D.res.loadGltf('gltfs/glb/modelNew.glb', { onProgress: (e) => this.onLoadProgress(e), onComplete: (e) => this.onComplete(e) })) as Object3D;
        this.scene.addChild(model);
        model.scaleX = model.scaleY = model.scaleZ = 0.001;
    }

    onLoadProgress(e) {
        console.log(e);
    }

    onComplete(e) {
        console.log(e);
    }

}
