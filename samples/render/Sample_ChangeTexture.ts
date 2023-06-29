import { Object3D, Scene3D, Engine3D, BoxGeometry, LitMaterial, MeshRenderer, } from "@orillusion/core";
import { createExampleScene } from "@samples/utils/ExampleScene";

class Sample_ChangeTexture {

    scene: Scene3D;
    async run() {
        await Engine3D.init();

        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;
        await this.initScene();
        Engine3D.startRenderView(exampleScene.view);

    }


    async initScene() {
        //create first box
        let box1 = new Object3D();
        box1.transform.z = -20;
        this.scene.addChild(box1);

        let render1 = box1.addComponent(MeshRenderer);
        render1.geometry = new BoxGeometry(20, 20, 20);
        let material1 = render1.material = new LitMaterial();
        material1.maskMap = Engine3D.res.maskTexture;

        //create second box
        let box2 = new Object3D();
        box2.transform.z = 20;
        this.scene.addChild(box2);

        let render2 = box2.addComponent(MeshRenderer);
        render2.geometry = new BoxGeometry(20, 20, 20);
        let material2 = render2.material = new LitMaterial();
        material2.maskMap = Engine3D.res.maskTexture;

        //load 2 textures for switching display
        let texture_0 = await Engine3D.res.loadTexture('textures/diffuse.jpg');
        let texture_1 = await Engine3D.res.loadTexture('textures/KB3D_NTT_Ads_basecolor.png');

        //auto change texture per 2 second
        let count = 0;
        setInterval(() => {
            if (count % 2 == 0) {
                material2.baseMap = texture_0;
            } else {
                material2.baseMap = texture_1;
            }
            count++;
        }, 2000);

    }

}

new Sample_ChangeTexture().run();