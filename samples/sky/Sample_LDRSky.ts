import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, Texture, SkyRenderer, BoxGeometry, LitMaterial, MeshRenderer, Object3D } from "@orillusion/core";

// sample to replace ldr sky map
class Sample_LDRSky {
    private _scene: Scene3D;
    private _originTexture: Texture;
    private _externalTexture: Texture;
    private _useExternal: boolean = false;
    async run() {
        // init engine
        await Engine3D.init({});

        // init scene
        this._scene = new Scene3D();
        let sky = this._scene.addComponent(SkyRenderer)
        sky.map = await Engine3D.res.loadLDRTextureCube('sky/LDR_sky.jpg')
        sky.roughness = 0.2
        this._scene.envMap = sky.map
        
        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this._scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // camera controller
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -10, 10);

        // create a basic cube
        let cubeObj = new Object3D();
        let mr = cubeObj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry();
        let mat = new LitMaterial();
        mr.material = mat;
        this._scene.addChild(cubeObj);
        
        // init view3D
        let view = new View3D();
        view.scene = this._scene;
        view.camera = mainCamera;

        // start renderer
        Engine3D.startRenderView(view);
    }

}

new Sample_LDRSky().run();