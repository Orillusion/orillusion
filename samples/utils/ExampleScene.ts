import { AtmosphericComponent, Camera3D, CameraUtil, DirectLight, Engine3D, HoverCameraController, KelvinUtil, Object3D, Scene3D, View3D } from "@orillusion/core";

type ExampleSceneContent = {
    scene: Scene3D,
    camera: Camera3D,
    light: DirectLight,
    view: View3D,
    hoverCtrl: HoverCameraController
    atmosphericSky?: AtmosphericComponent,
}

type ExampleSceneParam = {
    camera: {
        fov: number,
        roll: number,
        pitch: number,
        distance: number,
        near: number,
        far: number,
    },

    scene: {
        exposure: number,
        atmosphericSky?: any,
    },
    light: {
        position: {
            x: number,
            y: number,
            z: number,
        },
        euler: {
            x: number,
            y: number,
            z: number,
        },

        kelvin: number,
        intensity: number,
        castShadow: boolean,
    },
}

let exampleSceneParam: ExampleSceneParam;

/******** make an example scene param *******/
export function createSceneParam(): ExampleSceneParam {
    let param: ExampleSceneParam = {
        camera: {
            near: 1,
            far: 5000,
            distance: 100,
            fov: 60,
            pitch: -15,
            roll: -30,
        },

        scene: {
            exposure: 1,
            atmosphericSky: {}
        },

        light: {
            position: {
                x: 0,
                y: 30,
                z: -40,
            },
            euler: {
                x: 0,
                y: 200,
                z: 135,
            },

            kelvin: 5355,
            intensity: 30,
            castShadow: true,
        }
    }
    return param;
}

/******** direction light *******/
function createDirectLight(param: ExampleSceneParam): DirectLight {
    let lightObj3D = new Object3D();
    lightObj3D.x = param.light.position.x;
    lightObj3D.y = param.light.position.y;
    lightObj3D.z = param.light.position.z;
    lightObj3D.rotationX = param.light.euler.x;
    lightObj3D.rotationY = param.light.euler.y;
    lightObj3D.rotationZ = param.light.euler.z;

    let directLight = lightObj3D.addComponent(DirectLight);
    directLight.lightColor = KelvinUtil.color_temperature_to_rgb(param.light.kelvin);
    directLight.castShadow = param.light.castShadow;
    directLight.intensity = param.light.intensity;

    return directLight;
}


/******** make a scene by param *******/
export function createExampleScene(param?: ExampleSceneParam) {
    exampleSceneParam ||= createSceneParam();
    param ||= exampleSceneParam;

    // init Scene3D
    let scene = new Scene3D();
    scene.exposure = param.scene.exposure;

    // init sky
    let atmosphericSky: AtmosphericComponent;
    if (param.scene.atmosphericSky) {
        atmosphericSky = scene.addComponent(AtmosphericComponent);
    }

    // init Camera3D
    let cameraData = param.camera;
    let camera = CameraUtil.createCamera3DObject(scene);
    camera.perspective(cameraData.fov, Engine3D.aspect, cameraData.near, cameraData.far);

    // init Camera Controller
    let hoverCtrl = camera.object3D.addComponent(HoverCameraController);
    hoverCtrl.setCamera(cameraData.roll, cameraData.pitch, cameraData.distance);

    // init View3D
    let view = new View3D();
    view.scene = scene;
    view.camera = camera;

    // create direction light
    let light = createDirectLight(param);
    scene.addChild(light.object3D);

    //pkg
    let content = {} as ExampleSceneContent;
    content.camera = camera;
    content.light = light;
    content.scene = scene;
    content.view = view;
    content.atmosphericSky = atmosphericSky;
    content.hoverCtrl = hoverCtrl;

    // return
    return content;
}



