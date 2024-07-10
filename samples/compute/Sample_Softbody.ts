import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { AtmosphericComponent, BoxGeometry, CameraUtil, DirectLight, Engine3D, ForwardRenderJob, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, webGPUContext } from '@orillusion/core';
import { BunnySimulator } from "./softbody/BunnySimulator";

export class Demo_Softbody {
    constructor() { }

    async run() {

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 8;
        //Engine3D.setting.shadow.shadowBias = 0.000001;

        await Engine3D.init({});

        GUIHelp.init();

        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        await this.initScene(scene);

        let camera = CameraUtil.createCamera3DObject(scene);

        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctl = camera.object3D.addComponent(HoverCameraController);
        ctl.setCamera(30, -28, 15);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.grayTexture;
        mat.roughness = 0.8;
        mat.metallic = 0.1;

        let box = new Object3D();
        box.transform.y = 0.0;
        box.transform.x = 0.0;
        box.transform.z = 0.0;
        let mr = box.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry(3.0, 3.0, 3.0);
        let boxMat = new LitMaterial();
        boxMat.roughness = 0.8;
        boxMat.metallic = 0.1
        boxMat.cullMode = `front`
        //boxMat.depthCompare = `greater`

        mr.material = boxMat;
        // mr.material.doubleSide = true; 
        mr.castShadow = true;
        scene.addChild(box);

        let bunny = new Object3D();
        let simulator = bunny.addComponent(BunnySimulator);
        simulator.castShadow = true;
        simulator.SetInteractionBox(box);
        scene.addChild(bunny);

        // {
        //     let mat = new HDRLitMaterial();
        //     mat.baseMap = defaultTexture.createTexture(32, 32, 72, 126, 2, 255);
        //     mat.roughness = 0.8;
        //     let plane = new Object3D();
        //     plane.transform.y = -1;
        //     let planeMesh = plane.addComponent(MeshRenderer);
        //     planeMesh.geometry = new PlaneGeometry(100, 100);
        //     planeMesh.material = mat;
        //     planeMesh.receiveShadow = true;
        //     scene.addChild(plane);
        // }

        {
            var lightObj = new Object3D();
            lightObj.x = 0;
            lightObj.y = 0;
            lightObj.z = 0;
            lightObj.rotationX = 45;
            lightObj.rotationY = 0;
            lightObj.rotationZ = 0;
            let lc = lightObj.addComponent(DirectLight);
            lc.castShadow = true;
            lc.intensity = 3;
            scene.addChild(lightObj);
        }

    }

    // async initComputeBuffer() {}
}
