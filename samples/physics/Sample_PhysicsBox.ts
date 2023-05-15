import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Physics, Rigidbody } from "@orillusion/physics";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, Object3D, LitMaterial, Engine3D, BoxGeometry, MeshRenderer, ColliderComponent, BoxColliderShape, Vector3, PlaneGeometry, Color, SphereColliderShape, SphereGeometry } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_PhysicsBox {
    private scene: Scene3D;
    private materials: LitMaterial[];

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
        this.scene = exampleScene.scene;

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        await this.initScene(this.scene);
        GUIHelp.addButton('Make Ball', () => { this.createSphere(); })
        Engine3D.startRenderView(exampleScene.view);
    }

    initMaterials() {
        this.materials = [];
        for (let i = 0; i < 20; i++) {
            var mat = new LitMaterial();
            mat.baseColor = new Color(Math.random() * 1.0, Math.random() * 1.0, Math.random() * 1.0, 1.0);
            mat.metallic = Math.min(Math.random() * 0.1 + 0.2, 1.0);
            mat.roughness = Math.min(Math.random() * 0.5, 1.0);
            this.materials.push(mat);
        }
    }

    async initScene(scene: Scene3D) {
        /******** load hdr sky *******/
        let envMap = await Engine3D.res.loadHDRTextureCube('hdri/daytime.hdr');
        scene.envMap = envMap;

        //
        this.initMaterials();
        this.createGround();
        this.createWallBoxes();
        this.createSphere();
        return true;
    }


    // Create a large ball and let it fall freely from the air
    createSphere() {
        var sphereGeo = new SphereGeometry(2, 32, 32);
        var sphere = new Object3D();

        var meshRenderer = sphere.addComponent(MeshRenderer);
        meshRenderer.geometry = sphereGeo;
        var material = new LitMaterial();
        material.baseMap = Engine3D.res.grayTexture;

        meshRenderer.castShadow = true;
        meshRenderer.receiveShadow = true;
        meshRenderer.material = material;

        sphere.x = 0;
        sphere.y = 40;
        sphere.z = 0;

        let collider = sphere.addComponent(ColliderComponent);
        collider.shape = new SphereColliderShape(sphereGeo.radius);
        sphere.addComponent(Rigidbody);

        this.scene.addChild(sphere);
    }

    // make floor
    createGround() {
        let floorMat = new LitMaterial();
        floorMat.baseMap = Engine3D.res.grayTexture;
        floorMat.roughness = 0.85;
        floorMat.metallic = 0.01;
        floorMat.envIntensity = 0.01;

        let floor = new Object3D();
        let meshRenderer = floor.addComponent(MeshRenderer);
        meshRenderer.castShadow = true;
        meshRenderer.receiveShadow = true;
        meshRenderer.geometry = new PlaneGeometry(500, 500, 1, 1);
        meshRenderer.material = floorMat;

        let collider = floor.addComponent(ColliderComponent);
        collider.shape = new BoxColliderShape();
        collider.shape.size = new Vector3(500 / 2, 0.5, 500 / 2);

        let rigidbody = floor.addComponent(Rigidbody);
        rigidbody.mass = 0;

        this.scene.addChild(floor);
    }

    // Create some boxes and arrange them like a wall
    createWallBoxes() {
        let numBricksLength = 10;
        let numBricksHeight = 14;
        let materialIndex = 0;
        for (let i = 0; i < numBricksHeight; i++) {
            for (let j = 0; j < numBricksLength; j++) {
                let geo = new BoxGeometry(1, 1, 1);
                const element = new Object3D();
                let renderer = element.addComponent(MeshRenderer);
                renderer.geometry = geo;

                renderer.material = this.materials[materialIndex % this.materials.length];
                renderer.castShadow = true;
                renderer.receiveShadow = true;

                element.x = j - 4;
                element.y = i;

                let collider = element.addComponent(ColliderComponent);
                collider.shape = new BoxColliderShape();
                collider.shape.size = new Vector3(1, 1, 1);
                element.addComponent(Rigidbody);
                this.scene.addChild(element);
                materialIndex++;
            }
        }
    }

    loop() {
        Physics.update();
    }
}

new Sample_PhysicsBox().run();