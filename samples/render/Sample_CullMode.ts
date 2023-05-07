import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Engine3D, Scene3D, AtmosphericComponent, Object3D, Camera3D, OrbitController, DirectLight, Color, View3D, BitmapTexture2D, UnLitMaterial, MeshRenderer, PlaneGeometry, Vector3, GPUCullMode, CameraUtil, webGPUContext } from "@orillusion/core";

class Sample_CullMode {
    async run() {
        await Engine3D.init();
        GUIHelp.init();

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 10000.0);
        camera.object3D.z = 3;

        let oribit = camera.object3D.addComponent(OrbitController);
        oribit.autoRotate = true;
        oribit.autoRotateSpeed = 1;

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        // add direct light
        let lightObj = new Object3D();
        lightObj.rotationX = -45;
        let light = lightObj.addComponent(DirectLight);
        light.lightColor = new Color(1.0, 1.0, 1.0, 1.0);
        light.intensity = 10;
        scene.addChild(lightObj);

        let planeObj: Object3D;
        let texture = new BitmapTexture2D();
        await texture.load('https://cdn.orillusion.com/gltfs/cube/material_02.png');
        let material = new UnLitMaterial();
        material.baseMap = texture;
        material.cullMode = GPUCullMode.none;

        planeObj = new Object3D();
        let mr = planeObj.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(2, 2, 10, 10, Vector3.Z_AXIS);
        mr.material = material;
        scene.addChild(planeObj);

        //cull mode
        let cullMode = {};
        cullMode[GPUCullMode.none] = GPUCullMode.none;
        cullMode[GPUCullMode.front] = GPUCullMode.front;
        cullMode[GPUCullMode.back] = GPUCullMode.back;

        // change cull mode by click dropdown box
        GUIHelp.add({ cullMode: GPUCullMode.none }, 'cullMode', cullMode).onChange((v) => {
            material.cullMode = v;
        });
        GUIHelp.open();
        GUIHelp.endFolder();
    }
}

new Sample_CullMode().run();