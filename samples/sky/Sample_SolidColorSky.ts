import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, Texture, Color, SolidColorSky, Object3DUtil } from "@orillusion/core";

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
        // add default sky
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

        // gui
        GUIHelp.init();
        GUIHelp.addButton('Switch Maps', () => {
            if (!this._externalTexture) {
                // init solid color sky
                this._externalTexture = new SolidColorSky(new Color(0.5, 0.8, 0, 1));
                this._originTexture = this._scene.envMap;
                GUIHelp.addColor(this._externalTexture, 'color');
            }

            this._useExternal = !this._useExternal;
            this._scene.envMap = this._useExternal ? this._externalTexture : this._originTexture;
        })
        GUIHelp.open();
    }

}

new HDRSkyMap().run();