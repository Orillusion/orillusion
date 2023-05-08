import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, Vector3, MorphTargetBlender, Entity, CameraUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

// Sample of how to control the morphtarget animation
class Sample_MorphTarget {
    lightObj3D: Object3D;
    scene: Scene3D;
    influenceData: { [key: string]: number } = {};

    async run() {
        Engine3D.setting.shadow.shadowBias = 0.0001;

        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        camera.object3D.addComponent(HoverCameraController).setCamera(0, 0, 150);

        this.initDirectLight();
        await this.initMorphModel();

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    /******** light *******/
    initDirectLight() {
        this.lightObj3D = new Object3D();
        this.lightObj3D.rotationX = 21;
        this.lightObj3D.rotationY = 108;
        this.lightObj3D.rotationZ = 10;

        let directLight = this.lightObj3D.addComponent(DirectLight);
        directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        directLight.castShadow = true;
        directLight.intensity = 25;
        GUIUtil.renderDirLight(directLight, false);
        this.scene.addChild(this.lightObj3D);
    }

    private async initMorphModel() {
        GUIHelp.init();

        // load lion model
        let model = await Engine3D.res.loadGltf('gltfs/glb/lion.glb');
        model.y = -80.0;
        model.x = -30.0;
        this.scene.addChild(model);

        GUIHelp.addFolder('morph controller');
        // register MorphTargetBlender component
        let blendShapeComponent = model.addComponent(MorphTargetBlender);
        let targetRenderers = blendShapeComponent.cloneMorphRenderers();

        // bind influenceData to gui
        for (let key in targetRenderers) {
            this.influenceData[key] = 0.0;
            GUIHelp.add(this.influenceData, key, 0, 1, 0.01).onChange((v) => {
                this.influenceData[key] = v;
                let list = blendShapeComponent.getMorphRenderersByKey(key);
                for (let renderer of list) {
                    renderer.setMorphInfluence(key, v);
                }
            });
        }

        GUIHelp.open();
        GUIHelp.endFolder();

        // print hierarchy
        this.printHierarchy(model);
    }


    private printHierarchy(obj: Entity, path: string = '') {
        console.log(path, obj.name);

        path += '== ';
        for (let child of obj.entityChildren) {
            this.printHierarchy(child, path);
        }
    }

}

new Sample_MorphTarget().run();