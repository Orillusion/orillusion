import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Object3D, Camera3D, Vector3, View3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, BoxGeometry, CameraUtil, SphereGeometry, Color, Object3DUtil, BlendMode, Vector4, PostProcessingComponent, GTAOPost, SkinnedMeshRenderer, MorphTargetBlender, StorageUtil, Interpolator, HDRBloomPost } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { GUIController } from "@orillusion/debug/dat.gui.module";

//sample of direction light
class Sample_Game {
    scene: Scene3D;
    async run() {
        Engine3D.setting.shadow.enable = true;
        // Engine3D.setting.render.zPrePass = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowSize = 4096;
        Engine3D.setting.render.debug = false;
        Engine3D.setting.render.useLogDepth = false;
        // Engine3D.setting.occlusionQuery.octree = { width: 1000, height: 1000, depth: 1000, x: 0, y: 0, z: 0 }
        await Engine3D.init({});

        GUIHelp.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this.scene);
        // mainCamera.enableCSM = true;
        mainCamera.perspective(60, Engine3D.aspect, 2, 5000.0);
        //set camera data
        mainCamera.object3D.z = -15;
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(-15, -35, 1000);

        sky.relativeTransform = this.initLight();
        await this.initScene();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;



        Engine3D.startRenderView(view);
        GUIUtil.renderDebug();

        let post = this.scene.addComponent(PostProcessingComponent);
        post.addPost(GTAOPost);
        let bloom = post.addPost(HDRBloomPost);
        GUIUtil.renderBloom(bloom);
    }

    // create direction light
    private initLight() {
        // add a direction light
        let lightObj3D = new Object3D();
        lightObj3D.rotationX = 46;
        lightObj3D.rotationY = 174.56;
        lightObj3D.rotationZ = 0;
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 58;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;

        GUIUtil.renderDirLight(sunLight);
        this.scene.addChild(lightObj3D);
        return sunLight.transform;
    }

    async initScene() {
        let tex = await Engine3D.res.loadTexture("textures/grid.jpg");
        {
            let mat = new LitMaterial();
            // mat.baseMap = Engine3D.res.grayTexture;
            mat.uvTransform_1 = new Vector4(0, 0, 100, 100);
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = new BoxGeometry(10000, 1, 10000);
            mr.material = mat;
            mat.baseMap = tex;
            this.scene.addChild(floor);
        }

        //ThirdPersonIdle
        // let model = await Engine3D.res.loadGltf("character/SK_RYU_CASUAL_02.glb");
        // let model = await Engine3D.res.loadGltf("metaHuman/metahuman.gltf");
        // let model = await Engine3D.res.loadGltf("metaHuman/SK_RYU_HEAD.gltf");
        let model = await Engine3D.res.loadGltf("metaHuman/testMaterial.gltf");

        let data = StorageUtil.load("xunian");
        data[`faceList`] ||= {};

        // let model = await Engine3D.res.loadGltf("character/ThirdPersonIdle.glb");
        {
            // model.scaleX = 100 * 100 * 2;
            // model.scaleY = 100 * 100 * 2;
            // model.scaleZ = 100 * 100 * 2;

            // model.scaleX = 100;
            // model.scaleY = 100;
            // model.scaleZ = 100;
            this.scene.addChild(model);

            GUIHelp.addFolder('morph controller');
            // register MorphTargetBlender component
            let influenceData = {};
            let blendShapeComponent = model.addComponent(MorphTargetBlender);
            let targetRenderers = blendShapeComponent.cloneMorphRenderers();

            let dataList = {};
            for (const key in data[`faceList`]) {
                dataList[key] = key;
            }
            let select = { face: "" }
            GUIHelp.add(select, 'face', dataList).onChange(
                (v) => {
                    let faceData = data[`faceList`][select.face];
                    for (let key in targetRenderers) {
                        let start = influenceData[key];
                        let target = {};
                        target[key] = faceData[key];
                        Interpolator.to(influenceData, target, Math.random() * 200 + 100).onProgress = (p) => {
                            let list = blendShapeComponent.getMorphRenderersByKey(key);
                            for (let renderer of list) {
                                renderer.setMorphInfluence(key, influenceData[key]);
                            }
                        };
                    }
                }
            );

            let input = GUIHelp.add({ inputFace: "faceName" }, "inputFace") as GUIController
            GUIHelp.addButton("saveFace", () => {
                let faceData = {};
                for (let key in targetRenderers) {
                    faceData[key] = influenceData[key];
                }
                data[`faceList`][input.getValue()] = faceData;
                StorageUtil.save("xunian", data);
            });

            // bind influenceData to gui
            for (let key in targetRenderers) {
                influenceData[key] = 0.0;
                GUIHelp.add(influenceData, key, 0, 1, 0.01).onChange((v) => {
                    influenceData[key] = v;
                    let list = blendShapeComponent.getMorphRenderersByKey(key);
                    for (let renderer of list) {
                        renderer.setMorphInfluence(key, v);
                    }
                });
            }

            GUIHelp.open();
            GUIHelp.endFolder();

            let mrs = model.getComponentsInChild(SkinnedMeshRenderer);
            for (let i = 0; i < mrs.length; i++) {
                const mr = mrs[i];
                let mat = mr.material;
                // if (mat.name.toLocaleLowerCase().indexOf("hair") != -1)
                //     GUIUtil.renderMaterial(mat, false, mat.name);


                // GUIHelp.addButton("run", () => {
                //     mr.skeletonAnimation.play("run", 0.25);
                // });

                // GUIHelp.addButton("kick", () => {
                //     mr.skeletonAnimation.play("kick", 0.25);
                // });

                // GUIHelp.addButton("dance", () => {
                //     mr.skeletonAnimation.play("dance", 0.25);
                // });
            }
        }
    }
}

new Sample_Game().run();
