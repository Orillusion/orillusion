
import { AtmosphericComponent, CameraUtil, DirectLight, Engine3D, HoverCameraController, Object3D, PlaneGeometry, Scene3D, Vector3, View3D, webGPUContext } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { FlameSimulator } from "./flame/FlameSimulator";
import { FlameSimulatorMaterial } from "./flame/FlameSimulatorMaterial";

export class Demo_Flame {
    constructor() { }

    protected mLastPoint: Vector3 = new Vector3();
    protected mVelocity: Vector3 = new Vector3();

    async run() {
        await Engine3D.init({});

        GUIHelp.init();

        let scene = new Scene3D();
        let sky = scene.addComponent(AtmosphericComponent);
        await this.initScene(scene);

        let camera = CameraUtil.createCamera3DObject(scene);

        camera.perspective(60, webGPUContext.aspect, 0.01, 10000.0);
        let ctl = camera.object3D.addComponent(HoverCameraController);
        ctl.setCamera(0, 0, 5);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let cesiumMan = await Engine3D.res.loadGltf('gltfs/CesiumMan/CesiumMan.gltf');
        // cesiumMan.transform.localScale.set(10, 10, 10);
        cesiumMan.rotationX = -90;
        cesiumMan.rotationY = 180;
        cesiumMan.y = -0.8;
        scene.addChild(cesiumMan);

        // {
        //     let obj = new Object3D();
        //     obj.y = -1;
        //     obj.z = -10;
        //     let mr = obj.addComponent(MeshRenderer);
        //     mr.geometry = new PlaneGeometry(100, 100, 1, 1, Vector3.Y_AXIS);
        //     mr.material = new LitMaterial();
        //     mr.castShadow = true;
        //     mr.receiveShadow = true;
        //     scene.addChild(obj);
        // }

        {
            let obj = new Object3D();
            obj.rotationX = 120;
            obj.rotationY = 306;
            let light = obj.addComponent(DirectLight);
            light.intensity = 5;
            light.castShadow = true;
            light.debug();
            scene.addChild(obj);
        }

        let emulation = cesiumMan.addComponent(FlameSimulator);
        emulation.alwaysRender = true;
        emulation.geometry = new PlaneGeometry(0.01, 0.01, 1.0, 1.0, Vector3.Z_AXIS);
        emulation.material = new FlameSimulatorMaterial();

    }

    async initComputeBuffer() { }
}
