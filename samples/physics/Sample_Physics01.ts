import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Physics, Rigidbody } from "@orillusion/physics";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, Object3D, LitMaterial, Engine3D, BoxGeometry, MeshRenderer, ColliderComponent, BoxColliderShape, Vector3, PlaneGeometry, Color } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class SamplePhysics01 {
    private scene: Scene3D;
    private materials: LitMaterial[];
    private boxGeometry: BoxGeometry;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowSize = 4096;
        Engine3D.setting.shadow.shadowBound = 100;
        Engine3D.setting.shadow.shadowBias = 0.0001;

        await Physics.init();
        await Engine3D.init({ renderLoop: () => this.loop() });

        let sceneParam = createSceneParam();
        sceneParam.camera.distance = 50;
        let exampleScene = createExampleScene(sceneParam);

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        this.scene = exampleScene.scene;
        await this.initScene(this.scene);

        Engine3D.startRenderView(exampleScene.view);
    }

    async initScene(scene: Scene3D) {
        this.initMaterials();
        this.createGround();

        let interval = setInterval(() => {
            this.addRandomBox();
            if (scene.entityChildren.length > 500) {
                clearInterval(interval);
            }
        }, 50);
    }

    private addRandomBox() {
        this.boxGeometry ||= new BoxGeometry(1, 1, 1);
        let newBox = new Object3D();

        let meshRenderer = newBox.addComponent(MeshRenderer);
        meshRenderer.geometry = this.boxGeometry;
        meshRenderer.material = this.randomMaterial;
        meshRenderer.castShadow = true;
        meshRenderer.receiveShadow = true;

        newBox.y = 20;
        newBox.x = Math.random() * 20 - 10;
        newBox.z = Math.random() * 20 - 10;
        newBox.addComponent(Rigidbody);

        let collider = newBox.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(1, 1, 1);

        this.scene.addChild(newBox);
    }

    private initMaterials() {
        this.materials = [];
        for (let i = 0; i < 20; i++) {
            var mat = new LitMaterial();
            mat.baseColor = new Color(Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0, 1.0);
            mat.metallic = Math.min(Math.random() * 0.1 + 0.2, 1.0);
            mat.roughness = Math.min(Math.random() * 0.5, 1.0);
            this.materials.push(mat);
        }
    }

    private get randomMaterial(): LitMaterial {
        let count = Math.floor(this.materials.length * Math.random());
        return this.materials[count];
    }

    private createGround() {
        let floorMat = new LitMaterial();
        floorMat.baseMap = Engine3D.res.grayTexture;
        floorMat.roughness = 0.85;
        floorMat.metallic = 0.01;
        floorMat.envIntensity = 0.01;

        let floor = new Object3D();
        let renderer = floor.addComponent(MeshRenderer);

        renderer.castShadow = true;
        renderer.receiveShadow = true;
        renderer.geometry = new PlaneGeometry(500, 500, 1, 1);
        renderer.material = floorMat;

        let rigidBody = floor.addComponent(Rigidbody);
        rigidBody.mass = 0;

        let collider = floor.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(500, 0.05, 500);
        this.scene.addChild(floor);
    }

    private loop() {
        Physics.update();
    }
}

new SamplePhysics01().run();