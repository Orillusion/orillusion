import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, VertexAttributeName, LitMaterial, MeshRenderer, Vector4, Vector3, Matrix3, PostProcessingComponent, TAAPost, BitmapTexture2D, GlobalFog, Color, BoxGeometry, UnLitMaterial, PointLight, GTAOPost, BloomPost } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { GrassComponent, TerrainGeometry } from "@orillusion/effect";

// An sample of custom vertex attribute of geometry
class Sample_Boxes {
    view: View3D;
    post: PostProcessingComponent;
    async run() {
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 500;
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowSize = 1024;
        // Engine3D.setting.render.zPrePass = true;

        GUIHelp.init();

        await Engine3D.init();
        this.view = new View3D();
        this.view.scene = new Scene3D();
        this.view.scene.addComponent(AtmosphericComponent);

        this.view.camera = CameraUtil.createCamera3DObject(this.view.scene);
        this.view.camera.enableCSM = true;
        this.view.camera.perspective(60, webGPUContext.aspect, 1, 50000.0);
        this.view.camera.object3D.z = -15;
        this.view.camera.object3D.addComponent(HoverCameraController).setCamera(35, -20, 1000);

        Engine3D.startRenderView(this.view);

        this.post = this.view.scene.addComponent(PostProcessingComponent);
        this.post.addPost(GTAOPost);
        this.post.addPost(BloomPost);
        let fog = this.post.addPost(GlobalFog);
        fog.start = 91.0862;
        fog.end = 487.5528;
        fog.fogHeightScale = 0.0141;
        fog.density = 0.2343;
        fog.ins = 0.1041;
        fog.skyFactor = 0.5316;
        fog.overrideSkyFactor = 0.025;

        fog.fogColor = new Color(136 / 255, 215 / 255, 236 / 255, 1);
        fog.fogHeightScale = 0.1;
        fog.falloff = 2.5;
        fog.scatteringExponent = 7.196;
        fog.dirHeightLine = 6.5;

        GUIUtil.renderGlobalFog(fog);

        this.createScene(this.view.scene);
    }

    private async createScene(scene: Scene3D) {
        {
            let sunObj = new Object3D();
            let sunLight = sunObj.addComponent(DirectLight);
            sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
            sunLight.castShadow = true;
            sunLight.intensity = 45;
            sunObj.transform.rotationX = 50;
            sunObj.transform.rotationY = 50;
            GUIUtil.renderDirLight(sunLight);
            scene.addChild(sunObj);
        }

        {
            let geometry = new BoxGeometry(5, 200, 5);
            let litMaterial = new LitMaterial();
            // let litMaterial = new UnLitMaterial();
            let w = 30;
            let h = 30;
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    let obj = new Object3D();
                    let mr = obj.addComponent(MeshRenderer);
                    mr.material = litMaterial;
                    mr.geometry = geometry;
                    obj.x = i * 10 - w * 0.5 * 10;
                    obj.y = Math.random() * 100;
                    obj.z = j * 10 - h * 0.5 * 10;
                    scene.addChild(obj);
                }
            }

            let obj = new Object3D();
            let mr = obj.addComponent(MeshRenderer);
            mr.material = litMaterial;
            mr.geometry = geometry;
            obj.localScale = new Vector3(1000, 1, 1000);
            scene.addChild(obj);
        }

        {
            // for (let j = 0; j < 100; j++) {
            //     const lightObj = new Object3D();;
            //     let pointLight = lightObj.addComponent(PointLight);
            //     pointLight.castShadow = false;
            //     lightObj.transform.x = Math.random() * 100 * 10 - 100 * 10 * 0.5;
            //     lightObj.transform.y = 15;
            //     lightObj.transform.z = Math.random() * 100 * 10 - 100 * 10 * 0.5;
            //     pointLight.range = 100;
            //     pointLight.intensity = 60;
            //     scene.addChild(lightObj);
            // }
        }


        // let globalFog = this.post.getPost(GlobalFog);
        // GUIUtil.renderGlobalFog(globalFog);
    }

}

new Sample_Boxes().run();