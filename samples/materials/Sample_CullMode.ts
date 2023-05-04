import { Engine3D, Scene3D, AtmosphericComponent, Object3D, Camera3D, OrbitController, DirectLight, Color, View3D, BitmapTexture2D, UnLitMaterial, MeshRenderer, PlaneGeometry, Vector3, GPUCullMode } from "@orillusion/core";

export class Sample_CullMode {

    async run() {
        await Engine3D.init();

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        let camera = new Object3D();
        camera.z = 3;
        scene.addChild(camera)
        let mainCamera = camera.addComponent(Camera3D);
        mainCamera.perspective(60, window.innerWidth / window.innerHeight, 0.1, 10000.0);
        let oribit = camera.addComponent(OrbitController);
        oribit.autoRotate = true;
        oribit.autoRotateSpeed = 1;

        let lightObj = new Object3D();
        lightObj.rotationX = -45;
        let light = lightObj.addComponent(DirectLight);
        light.lightColor = new Color(1.0, 1.0, 1.0, 1.0);
        light.intensity = 10;
        scene.addChild(lightObj);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);

        let planeObj: Object3D
        let texture = new BitmapTexture2D();
        await texture.load('https://cdn.orillusion.com/gltfs/cube/material_02.png');
        let mat = new UnLitMaterial();
        mat.baseMap = texture;
        // mat.cullMode = GPUCullMode.none;
        // mat.roughness = 1;

        planeObj = new Object3D();
        let mr = planeObj.addComponent(MeshRenderer);
        mr.geometry = new PlaneGeometry(2, 2, 10, 10, Vector3.Z_AXIS);
        mr.material = mat;
        scene.addChild(planeObj);

        let modeDict = {};
        modeDict[GPUCullMode.none] = GPUCullMode.none;
        modeDict[GPUCullMode.front] = GPUCullMode.front;
        modeDict[GPUCullMode.back] = GPUCullMode.back;
    }
}
