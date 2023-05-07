import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, Texture, AtmosphericScatteringSky } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

// sample of AtmosphericSky
class Sample_AtmosphericSky {
    private _scene: Scene3D;

    async run() {
        // init engine
        await Engine3D.init({});

        // init scene
        this._scene = new Scene3D();
        // add atmospheric sky
        let component = this._scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, this._scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);

        // camera controller
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(45, -10, 10);

        // init view3D
        let view = new View3D();
        view.scene = this._scene;
        view.camera = mainCamera;

        // start renderer
        Engine3D.startRenderView(view);

        // gui
        GUIHelp.init();
        GUIUtil.renderAtomosphericSky(component);
    }

}

new Sample_AtmosphericSky().run();