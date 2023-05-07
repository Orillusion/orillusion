import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, UnLitMaterial, MeshRenderer, PlaneGeometry, GPUAddressMode, GPUFilterMode, GPUCompareFunction, LitMaterial, Object3DUtil } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { UVMoveComponent } from "@samples/material/script/UVMoveComponent";

class Sample_TextureSample {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.shadow.shadowBound = 5;
        Engine3D.setting.shadow.shadowBias = 0.001;

        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        camera.object3D.addComponent(HoverCameraController).setCamera(25, -30, 100);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.initScene();
    }

    async initScene() {
        /******** sky *******/
        {
            this.scene.exposure = 1;
            this.scene.roughness = 0.0;
        }
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 57;
            this.lightObj3D.rotationY = 347;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 6;
            GUIHelp.init();
            GUIUtil.renderDirLight(directLight, false);
            this.scene.addChild(this.lightObj3D);
        }

        {
            // load texture
            let texture = await Engine3D.res.loadTexture("textures/diffuse.jpg");
            let material = new LitMaterial();
            material.baseMap = texture;

            let plane = new Object3D();
            let renderer = plane.addComponent(MeshRenderer);
            renderer.material = material;
            renderer.geometry = new PlaneGeometry(100, 100, 1, 1);
            this.scene.addChild(plane);

            let component = plane.addComponent(UVMoveComponent);
            GUIUtil.renderUVMove(component);


            this.scene.addChild(Object3DUtil.GetSingleCube(10, 10, 10, 1, 0.5, 0.5));

            // enum GPUAddressMode
            let address = {}
            address[GPUAddressMode.repeat] = GPUAddressMode.repeat;
            address[GPUAddressMode.clamp_to_edge] = GPUAddressMode.clamp_to_edge;
            address[GPUAddressMode.mirror_repeat] = GPUAddressMode.mirror_repeat;

            // enum GPUFilterMode
            let filter = {}
            filter[GPUFilterMode.nearest] = GPUFilterMode.nearest;
            filter[GPUFilterMode.linear] = GPUFilterMode.linear;

            // enum GPUCompareFunction
            let depthCompare = {}
            depthCompare[GPUCompareFunction.not_equal] = GPUCompareFunction.not_equal;
            depthCompare[GPUCompareFunction.always] = GPUCompareFunction.always;
            depthCompare[GPUCompareFunction.never] = GPUCompareFunction.never;
            depthCompare[GPUCompareFunction.not_equal] = GPUCompareFunction.not_equal;
            depthCompare[GPUCompareFunction.greater_equal] = GPUCompareFunction.greater_equal;
            depthCompare[GPUCompareFunction.greater] = GPUCompareFunction.greater;
            depthCompare[GPUCompareFunction.less_equal] = GPUCompareFunction.less_equal;
            depthCompare[GPUCompareFunction.less] = GPUCompareFunction.less;

            // GUI
            GUIHelp.addFolder("Texture Sampler");
            GUIHelp.add({ addressModeU: texture.addressModeU }, 'addressModeU', address).onChange((v) => {
                texture.addressModeU = v;
            });
            GUIHelp.add({ addressModeV: texture.addressModeV }, 'addressModeV', address).onChange((v) => {
                texture.addressModeV = v;
            });

            GUIHelp.add({ minFilter: texture.minFilter }, 'minFilter', filter).onChange((v) => {
                texture.minFilter = v;
            });
            GUIHelp.add({ magFilter: texture.magFilter }, 'magFilter', filter).onChange((v) => {
                texture.magFilter = v;
            });

            GUIHelp.add({ mipmapFilter: texture.mipmapFilter }, 'mipmapFilter', filter).onChange((v) => {
                texture.mipmapFilter = v;
            });

            GUIHelp.add({ depthCompare: material.depthCompare }, 'depthCompare', depthCompare).onChange((v) => {
                material.depthCompare = v;
            });

            GUIHelp.add(texture, 'useMipmap');

            GUIHelp.open();
            GUIHelp.endFolder();
        }
    }

}

new Sample_TextureSample().run();