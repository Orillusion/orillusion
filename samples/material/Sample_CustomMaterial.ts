import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitMaterial, Color, MeshRenderer, Object3DUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

//Display UnLit shaders unaffected by light
class Sample_CustomMaterial {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        Engine3D.setting.material.materialChannelDebug = true;

        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.debug = true;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(45, -45, 20);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        //create light
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.x = 0;
            this.lightObj3D.y = 30;
            this.lightObj3D.z = -40;
            this.lightObj3D.rotationX = 77;
            this.lightObj3D.rotationY = 77;
            this.lightObj3D.rotationZ = 41;
            let lc = this.lightObj3D.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 10;
            GUIUtil.renderDirLight(lc);
            scene.addChild(this.lightObj3D);
        }
        {
            //create floor
            let floor = Object3DUtil.GetCube();
            floor.scaleX = 1000;
            floor.scaleY = 1;
            floor.scaleZ = 1000;
            this.scene.addChild(floor);

            //center
            let centerCube = Object3DUtil.GetCube();
            centerCube.scaleX = 1;
            centerCube.scaleY = 1;
            centerCube.scaleZ = 1;
            centerCube.x = 2.5;
            centerCube.y = 2.5;
            this.scene.addChild(centerCube);

            //left
            let leftCube = Object3DUtil.GetCube();
            leftCube.scaleX = 4;
            leftCube.scaleY = 4;
            leftCube.scaleZ = 1;
            leftCube.x = 4;
            leftCube.y = 2;
            this.scene.addChild(leftCube);

            //right
            let rightCube = Object3DUtil.GetCube();
            rightCube.scaleX = 4;
            rightCube.scaleY = 4;
            rightCube.scaleZ = 1;
            rightCube.x = -4;
            rightCube.y = 2;
            this.scene.addChild(rightCube);

            //ulit material
            let unlitObj = new Object3D();
            let unlitMat = new UnLitMaterial();
            unlitMat.baseColor = Color.random();
            let mr = unlitObj.addComponent(MeshRenderer);
            mr.geometry = Object3DUtil.CubeMesh;
            mr.material = unlitMat;
            unlitObj.scaleX = 2;
            unlitObj.scaleY = 2;
            unlitObj.scaleZ = 2;
            unlitObj.y = 2;
            this.scene.addChild(unlitObj);
        }
        return true;
    }
}

new Sample_CustomMaterial().run();