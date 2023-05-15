import { Engine3D, Scene3D, CameraUtil, View3D, AtmosphericComponent, ComponentBase, Time, AxisObject, Object3DUtil, KelvinUtil, DirectLight, Object3D, HoverCameraController, MeshRenderer, LitMaterial, BoxGeometry, UnLit, UnLitMaterial, Interpolator } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

// sample use component
class Sample_AddRemove {
    view: View3D;
    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        // add atmospheric sky
        scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -30, 300);

        // create a view with target scene and camera
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(this.view);

        // gui
        GUIHelp.init();

        await this.test();
    }

    private test() {
        let list: Object3D[] = [];
        let index = 0;
        GUIHelp.addButton("add", async () => {
            // let obj = new Object3D();
            // obj.z += index++ * 1;
            // obj.x = Math.random() * 100 - 50
            // obj.y = Math.random() * 100 - 50
            // obj.z = Math.random() * 100 - 50
            // let mr = obj.addComponent(MeshRenderer);
            // mr.material = new LitMaterial();
            // mr.geometry = new BoxGeometry(10, 10, 10);
            // this.view.scene.addChild(obj);

            /******** player1 *******/
            let player1 = (await Engine3D.res.loadGltf('gltfs/anim/Minion_Lane_Super_Dawn/Minion_Lane_Super_Dawn.glb', {})) as Object3D;
            player1.transform.scaleX = 10;
            player1.transform.scaleY = 10;
            player1.transform.scaleZ = 10;

            let cc = player1.clone();
            this.view.scene.addChild(cc);
            list.push(cc);

            // Interpolator.to(cc, { z: 100, scaleX: 5, scaleY: 5, scaleZ: 5 }, 1000).onComplete = () => {
            //     this.view.scene.removeChild(cc);
            //     let index = list.indexOf(cc);
            //     list.splice(index, 1);
            // };
        });

        GUIHelp.addButton("remove", () => {
            let index = Math.floor(list.length * Math.random());
            let obj = list[index];
            if (obj) {
                console.log(index, list);
                list.splice(index, 1);
                obj.destroy();
            }
        });

        GUIHelp.endFolder();
    }
}

new Sample_AddRemove().run();