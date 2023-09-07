import { Engine3D, Scene3D, CameraUtil, View3D, AtmosphericComponent, ComponentBase, Time, AxisObject, Object3DUtil, KelvinUtil, DirectLight, Object3D, HoverCameraController } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

// sample use component
class Sample_ComponentLife {
    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();
        // add atmospheric sky
        scene.addComponent(AtmosphericComponent);

        // init camera3D
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -15, 10);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);

        // create cube
        let cube = Object3DUtil.GetSingleCube(2, 4, 1, 0.7, 1, 0.5);
        cube.name = 'cube'
        scene.addChild(cube);

        // register a component
        let component = cube.addComponent(LifeComponent);
    }
}


class LifeComponent extends ComponentBase {
    public init(param?: any): void {
        console.log('init');

    }
    public start(): void {
        console.log('start');
    }

    public onBeforeUpdate(view?: View3D) {
        console.log('onBeforeUpdate');
    }

    public onCompute(view?: View3D, command?: GPUCommandEncoder) {
        console.log('onUpdate');
    }

    public onUpdate(): void {
        console.log('onUpdate');
    }

    public onLateUpdate(view?: View3D) {
        console.log('onLateUpdate');
    }
}


new Sample_ComponentLife().run();