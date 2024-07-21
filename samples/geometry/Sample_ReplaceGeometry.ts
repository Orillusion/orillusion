import { BoxGeometry, Engine3D, GeometryBase, LitMaterial, MeshRenderer, Object3D, Object3DUtil, Scene3D, SphereGeometry, TorusGeometry, Vector3 } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

// An sample to replace geometry of meshRenderer
class Sample_ReplaceGeometry {
    scene: Scene3D;
    geometries: GeometryBase[];
    renderer: MeshRenderer;
    index = 0;
    async run() {
        let param = createSceneParam();
        param.light.intensity = 1;
        param.camera.distance = 40;
        await Engine3D.init();
        let exampleScene = createExampleScene(param);

        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowSize = 2048;
        Engine3D.setting.shadow.shadowBias = 0.04;

        this.scene = exampleScene.scene;

        Engine3D.startRenderView(exampleScene.view);


        GUIHelp.init();
        this.initGeometries();

        let duck = await (await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf')) as Object3D;
        let duckGeometry = duck.getComponents(MeshRenderer)[0].geometry;
        this.geometries.push(duckGeometry);

        this.initRenderer();
        let scale = new Vector3(1, 1, 1);
        GUIHelp.add(this, 'index', 0, 4, 1).onChange((value) => {
            this.renderer.geometry = this.geometries[value];
            if (value == this.geometries.length - 1) {
                scale.set(0.03, 0.03, 0.03);
            } else {
                scale.set(1, 1, 1);
            }
            this.renderer.object3D.localScale = scale;
        })

        GUIHelp.open();
        this.initFloor();
    }

    initFloor() {
        let floorHeight = 20;
        let floor = Object3DUtil.GetSingleCube(1000, floorHeight, 1000, 0.5, 0.5, 0.5);
        floor.y = -floorHeight;
        this.scene.addChild(floor);
    }

    initGeometries() {
        this.geometries = [];
        this.geometries.push(new SphereGeometry(2, 20, 20));
        this.geometries.push(new BoxGeometry(2, 8, 4));
        this.geometries.push(new TorusGeometry(2, 0.4));
    }

    initRenderer() {
        let obj = new Object3D();
        this.renderer = obj.addComponent(MeshRenderer);
        this.renderer.material = new LitMaterial();
        this.renderer.geometry = this.geometries[0];
        this.scene.addChild(obj);
    }
}

new Sample_ReplaceGeometry().run();