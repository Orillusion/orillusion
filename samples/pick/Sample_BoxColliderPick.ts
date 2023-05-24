import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Scene3D, Engine3D, BoxGeometry, SphereGeometry, SphereColliderShape, BoxColliderShape, Vector3, Object3D, MeshRenderer, LitMaterial, ColliderComponent, PointerEvent3D, Color } from "@orillusion/core";

class Sample_BoxColliderPick {
    scene: Scene3D;
    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `bound`;

        // init Engine3D
        await Engine3D.init({});

        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;

        GUIHelp.init();

        GUIUtil.renderDirLight(exampleScene.light, false);
        Engine3D.startRenderView(exampleScene.view);

        this.initPickObject(this.scene);
    }

    //create some interactive boxes
    private initPickObject(scene: Scene3D): void {
        let size: number = 9;

        //geometry
        let boxGeometry = new BoxGeometry(size, size, size);
        let sphereGeometry = new SphereGeometry(size / 2, 20, 20);

        //collider shape
        let sphereShape = new SphereColliderShape(size / 2);
        let boxShape = new BoxColliderShape().setFromCenterAndSize(new Vector3(0, 0, 0), new Vector3(size, size, size));

        for (let i = 0; i < 10; i++) {
            let obj = new Object3D();
            obj.name = 'sphere ' + i;
            scene.addChild(obj);
            obj.x = (i - 5) * 15;
            let renderer = obj.addComponent(MeshRenderer);
            renderer.geometry = i % 2 ? boxGeometry : sphereGeometry;
            renderer.material = new LitMaterial();

            // register collider component
            let collider = obj.addComponent(ColliderComponent);
            collider.shape = i % 2 ? boxShape : sphereShape;
        }
        let pickFire = Engine3D.views[0].pickFire;
        // register event
        pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onMousePick, this);
    }

    private onMousePick(e: PointerEvent3D) {
        let pick = e.data.pick;
        if (pick && pick.object3D) {
            let obj = pick.object3D;
            let meshRenderer = obj.getComponent(MeshRenderer);
            //modify base color
            meshRenderer.material.baseColor = new Color(Math.random(), Math.random(), Math.random())
        }
    }

}

new Sample_BoxColliderPick().run();