import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, Texture, SkyRenderer } from "@orillusion/core";

// sample to replace standard sky map
class Sample_BitmapCubeStdSky {
    private _scene: Scene3D;
    async run() {
        // init engine
        await Engine3D.init({});

        // init scene
        this._scene = new Scene3D();

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this._scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // camera controller
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, -10, 10);

        // init view3D
        let view = new View3D();
        view.scene = this._scene;
        view.camera = mainCamera;

        // start renderer
        Engine3D.startRenderView(view);

        // load standard sky texture
        let url = 'sky/StandardCubeMap-2.jpg';
        
        let sky = this._scene.addComponent(SkyRenderer)
        sky.map = await Engine3D.res.loadTextureCubeStd(url);
        this._scene.envMap = sky.map
    }

}

new Sample_BitmapCubeStdSky().run();