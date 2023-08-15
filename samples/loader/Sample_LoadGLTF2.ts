import { Engine3D, Object3D, Object3DUtil, Scene3D } from "@orillusion/core";
import { createExampleScene } from "@samples/utils/ExampleScene";

//Samples to show models, they are using PBR material
class Sample_LoadGLTF2 {
    lightObj3D: Object3D;
    scene: Scene3D;
    async run() {
        //config settings
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 80;

        //init engine
        await Engine3D.init();
        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;
        Engine3D.startRenderView(exampleScene.view);
        await this.initScene();
    }

    async initScene() {

        let floor = Object3DUtil.GetSingleCube(100, 4, 100, 0.5, 0.5, 0.5);
        floor.y = -10;
        this.scene.addChild(floor);

        let chair = await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf') as Object3D;
        chair.scaleX = chair.scaleY = chair.scaleZ = 60;
        chair.rotationZ = chair.rotationX = 45;
        this.scene.addChild(chair);
    }
}

new Sample_LoadGLTF2().run();