import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { MaterialStateComponent } from "@samples/pick/MaterialStateComponent";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Scene3D, Engine3D, MeshRenderer, ColliderComponent, PointerEvent3D, SphereGeometry, Object3D, LitMaterial, Color } from "@orillusion/core";

class Sample_PixelPick {
    scene: Scene3D;

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;
        // init Engine3D
        await Engine3D.init({});

        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;

        Engine3D.startRenderView(exampleScene.view);

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        await this.initPickObject(this.scene);

        this.registerEvents();
    }

    private registerEvents() {
        // register event
        let pickFire = this.scene.view.pickFire;
        pickFire.addEventListener(PointerEvent3D.PICK_UP, this.onMouseUp, this);
        pickFire.addEventListener(PointerEvent3D.PICK_DOWN, this.onMouseDown, this);
        pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onMousePick, this);
        pickFire.addEventListener(PointerEvent3D.PICK_OVER, this.onMouseOver, this);
        pickFire.addEventListener(PointerEvent3D.PICK_OUT, this.onMouseOut, this);
    }

    private async initPickObject(scene: Scene3D) {
        //load model
        let wukong = await Engine3D.res.loadGltf('gltfs/wukong/wukong.gltf');
        this.scene.addChild(wukong);

        wukong.transform.x = 50;
        wukong.transform.scaleX = 10;
        wukong.transform.scaleY = 10;
        wukong.transform.scaleZ = 10;

        // register events
        wukong.forChild((node) => {
            if (node.hasComponent(MeshRenderer)) {
                node.addComponent(MaterialStateComponent);
                node.addComponent(ColliderComponent);
            }
        });

        // add sphere list and register mouse events
        let size: number = 9;
        let geometry = new SphereGeometry(size / 2, 20, 20);
        for (let i = 0; i < 10; i++) {
            let obj = new Object3D();
            obj.name = 'sphere ' + i;
            scene.addChild(obj);
            obj.x = (i - 5) * 10;

            let mat = new LitMaterial();
            mat.roughness = i / 10;
            mat.metallic_max = 1.0;
            mat.metallic_min = 0.0;
            mat.metallic = 0.6;

            let renderer = obj.addComponent(MeshRenderer);
            renderer.geometry = geometry;
            renderer.material = mat;

            obj.addComponent(MaterialStateComponent);

            // register collider component
            obj.addComponent(ColliderComponent);
        }
    }

    private getPickObject(e: PointerEvent3D): Object3D {
        let pick = e.data.pick;
        return pick ? pick.object3D : null;
    }

    private onMouseUp(e: PointerEvent3D) {
        let obj = this.getPickObject(e);
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc.changeColor(new Color(2, 0, 0, 1), 120);
        }
    }

    private onMouseDown(e: PointerEvent3D) {
        let obj = this.getPickObject(e);
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc.changeColor(new Color(2, 2, 0, 1), 120);
        }
    }

    private onMousePick(e: PointerEvent3D) {
        let obj = this.getPickObject(e);
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc.changeColor(new Color(2, 0, 0, 1), 120);
        }
    }

    private onMouseOver(e: PointerEvent3D) {
        let obj = this.getPickObject(e);
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc.changeColor(new Color(1, 0.64, 0.8, 2.5), 100);
        }
    }

    private onMouseOut(e: PointerEvent3D) {
        let obj = this.getPickObject(e);
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc.changeColor(new Color(0, 0, 0), 120);
        }
    }

}

new Sample_PixelPick().run();
