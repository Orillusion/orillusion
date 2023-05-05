import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, Texture } from "@orillusion/core";

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
        // add sky
        this._scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this._scene);
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);

        // camera controller
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -10, 10);

        // init view3D
        let view = new View3D();
        view.scene = this._scene;
        view.camera = mainCamera;

        // start renderer
        Engine3D.startRenderView(view);

        // load LDR sky texture
        this._externalTexture = await Engine3D.res.loadLDRTextureCube('sky/LDR_sky.jpg');

        // gui
        GUIHelp.init();
        GUIHelp.addButton('Switch Maps', () => {
            this._originTexture ||= this._scene.envMap;
            this._useExternal = !this._useExternal;
            this._scene.envMap = this._useExternal ? this._externalTexture : this._originTexture;
        })
        GUIHelp.open();
    }

}

new Sample_LDRSky().run();