import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { OrbitController } from "../../src/components/controller/OrbitController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { MeshRenderer } from "../../src/components/renderer/MeshRenderer";
import { Camera3D } from "../../src/core/Camera3D";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Object3D } from "../../src/core/entities/Object3D";
import { GPUCullMode } from "../../src/gfx/graphics/webGpu/WebGPUConst";
import { UnLitMaterial } from "../../src/materials/UnLitMaterial";
import { Color } from "../../src/math/Color";
import { Vector3 } from "../../src/math/Vector3";
import { PlaneGeometry } from "../../src/shape/PlaneGeometry";
import { BitmapTexture2D } from "../../src/textures/BitmapTexture2D";

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
