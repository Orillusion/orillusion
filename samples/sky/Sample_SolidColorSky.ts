import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, Texture, Color, SolidColorSky, Object3DUtil, SkyRenderer, BoxGeometry, LitMaterial, MeshRenderer, Object3D } from "@orillusion/core";

// sample to display solid color sky
class HDRSkyMap {
    private _scene: Scene3D;
    private _externalTexture: SolidColorSky;
    private _originTexture: Texture;
    private _useExternal: boolean = false;

    async run() {
        // init engine
        await Engine3D.init({});

        // init scene
        this._scene = new Scene3D();
        // use default env lights
        this._scene.addComponent(AtmosphericComponent)
        // use solid color as background
        let sky = this._scene.addComponent(SkyRenderer)
        sky.map = new SolidColorSky(new Color(0.3, 0.3, 0.3, 1))

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

new HDRSkyMap().run();