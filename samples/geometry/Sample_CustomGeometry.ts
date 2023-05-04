import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, VertexAttributeName, LitMaterial, MeshRenderer } from "@orillusion/core";

export class Sample_CustomGeometry {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.material.materialChannelDebug = true;

        await Engine3D.init();
        let view = new View3D();
        view.scene = new Scene3D();;
        view.camera = CameraUtil.createCamera3DObject(view.scene);

        view.scene.addComponent(AtmosphericComponent);

        view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        view.camera.object3D.z = -15;
        view.camera.object3D.addComponent(HoverCameraController);

        // 
        // 
        // Engine3D.startRenderView(view);
        Engine3D.startRenderViews([view]);
        this.createScene(view.scene);
    }

    private async createScene(scene: Scene3D) {
        let sunObj = new Object3D();
        let sunLight = sunObj.addComponent(DirectLight);
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(65533);
        sunLight.castShadow = true;
        sunObj.transform.rotationX = 50;
        sunObj.transform.rotationY = 50;
        sunLight.debug();
        scene.addChild(sunObj);

        let geo = new PlaneGeometry(100, 100, 100, 100);
        let att = geo.getAttribute(VertexAttributeName.position);
        let len = att.data.length / 3;

        let mat = new LitMaterial();
        // mat.shaderState.topology = GPUPrimitiveTopology.point_list

        let parent = new Object3D();
        let mr = parent.addComponent(MeshRenderer);
        mr.geometry = geo;
        mr.material = mat;

        for (let i = 0; i < len; i++) {
            att.data[i * 3 + 0];
            att.data[i * 3 + 1] += Math.random() * 100;
            att.data[i * 3 + 2];
        }
        scene.addChild(parent);
    }


}