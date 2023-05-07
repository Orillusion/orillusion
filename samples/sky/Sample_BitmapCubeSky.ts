import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, CameraUtil, HoverCameraController, View3D, Texture, SkyRenderer } from "@orillusion/core";

// sample to replace sky map. (witch contains 6 faces)
class Sample_BitmapCubeSky {
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

        // load sky texture (nx/px/py/ny/nz/pz), a total of 6 images
        let urls: string[] = [];
        urls.push('textures/cubemap/skybox_nx.png');
        urls.push('textures/cubemap/skybox_px.png');
        urls.push('textures/cubemap/skybox_py.png');
        urls.push('textures/cubemap/skybox_ny.png');
        urls.push('textures/cubemap/skybox_nz.png');
        urls.push('textures/cubemap/skybox_pz.png');

        let sky = this._scene.addComponent(SkyRenderer)
        sky.map = await Engine3D.res.loadTextureCubeMaps(urls);
        this._scene.envMap = sky.map
    }

}

new Sample_BitmapCubeSky().run();