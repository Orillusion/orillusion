import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, PlaneGeometry, VertexAttributeName, LitMaterial, MeshRenderer, Vector4, Vector3, Matrix3, PostProcessingComponent, TAAPost, BitmapTexture2D, GlobalFog, Color } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { GrassComponent, TerrainGeometry } from "@orillusion/effect";

// An sample of custom vertex attribute of geometry
class Sample_Terrain {
    view: View3D;
    post: PostProcessingComponent;
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBias = 0.0003;
        Engine3D.setting.shadow.shadowBound = 500;
        Engine3D.setting.shadow.shadowSize = 1024;
        // Engine3D.setting.render.zPrePass = true;

        GUIHelp.init();

        await Engine3D.init();
        this.view = new View3D();
        this.view.scene = new Scene3D();
        this.view.scene.addComponent(AtmosphericComponent);

        this.view.camera = CameraUtil.createCamera3DObject(this.view.scene);
        this.view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        this.view.camera.object3D.z = -15;
        this.view.camera.object3D.addComponent(HoverCameraController).setCamera(35, -20, 500);

        Engine3D.startRenderView(this.view);

        this.post = this.view.scene.addComponent(PostProcessingComponent);
        let fog = this.post.addPost(GlobalFog);
        fog.start = 116;
        fog.end = 0;
        fog.fogHeightScale = 0.116;
        fog.density = 0.094;
        fog.ins = 0.1041;
        fog.skyFactor = 0.35;
        fog.overrideSkyFactor = 0.7;

        fog.fogColor = new Color(136 / 255, 215 / 255, 236 / 255, 1);
        fog.fogHeightScale = 0.1;
        fog.falloff = 0.626;
        fog.scatteringExponent = 8;
        fog.dirHeightLine = 6.5;
        // post.addPost(TAAPost);

        this.createScene(this.view.scene);
    }

    private async createScene(scene: Scene3D) {
        //bitmap
        let bitmapTexture = await Engine3D.res.loadTexture('terrain/test01/bitmap.png');
        let heightTexture = await Engine3D.res.loadTexture('terrain/test01/height.png');
        let grassTexture = await Engine3D.res.loadTexture('terrain/grass/GrassThick.png');
        let gustNoiseTexture = await Engine3D.res.loadTexture('terrain/grass/displ_noise_curl_1.png');
        let sunObj = new Object3D();
        let sunLight = sunObj.addComponent(DirectLight);
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;
        sunLight.intensity = 49;
        sunObj.transform.rotationX = 50;
        sunObj.transform.rotationY = 50;
        GUIUtil.renderDirLight(sunLight);
        scene.addChild(sunObj);

        let terrainSize = 1000;
        let terrainGeometry: TerrainGeometry;
        {
            let mat = new LitMaterial();
            terrainGeometry = new TerrainGeometry(terrainSize, terrainSize);
            terrainGeometry.setHeight(heightTexture as BitmapTexture2D, 300);
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = terrainGeometry;
            mat.baseMap = bitmapTexture;
            mr.material = mat;
            scene.addChild(floor);
        }

        GUIHelp.addFolder("shadow");
        GUIHelp.add(Engine3D.setting.shadow, "shadowBound", 0.0, 3000, 0.0001);
        GUIHelp.add(Engine3D.setting.shadow, "shadowBias", 0.0, 1, 0.0001);
        GUIHelp.endFolder();

        let globalFog = this.post.getPost(GlobalFog);
        GUIUtil.renderGlobalFog(globalFog);
    }

}

new Sample_Terrain().run();