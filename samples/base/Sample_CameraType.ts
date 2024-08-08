import { Engine3D, Scene3D, AtmosphericComponent, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, View3D, Camera3D, GridObject, Frustum, OrbitController, Vector3 } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import * as dat from "dat.gui"

// initializa engine
await Engine3D.init();

// create new scene as root node
let scene3D: Scene3D = new Scene3D();

// add performance stats
scene3D.addComponent(Stats)

// add an Atmospheric sky enviroment
let sky = scene3D.addComponent(AtmosphericComponent);
sky.sunY = 0.6;

// create camera
let cameraObj: Object3D = new Object3D();
let camera = cameraObj.addComponent(Camera3D);
// adjust camera view
camera.perspective(45, Engine3D.aspect, 0.1, 1000.0);
camera.lookAt(new Vector3(0, 10, 10), Vector3.ZERO, Vector3.UP)
// set camera controller
let controller = cameraObj.addComponent(OrbitController);
// add camera node
scene3D.addChild(cameraObj);

// create light obj
let light: Object3D = new Object3D();
// adjust light rotation
light.rotationX = 45;
light.rotationY = 30;
// add direct light component
let dirLight: DirectLight = light.addComponent(DirectLight);
dirLight.intensity = 3;
// add light object to scene
scene3D.addChild(light);

// create a box
const box: Object3D = new Object3D();
// add MeshRenderer
let mr: MeshRenderer = box.addComponent(MeshRenderer);
// set geometry
mr.geometry = new BoxGeometry(1, 1, 1);
// set material
mr.material = new LitMaterial();
// set rotation
box.rotationY = 0;
box.y = 1
// add object
scene3D.addChild(box);

// add a grid
let grid = new GridObject(1000, 100);
scene3D.addChild(grid)

// create a view with target scene and camera
let view = new View3D();
view.scene = scene3D;
view.camera = camera;
// start render
Engine3D.startRenderView(view);

// add debug GUI
let gui = new dat.GUI();
let f = gui.addFolder('Camera')
let buttons = {
    'ortho': () => camera.ortho(camera.frustumSize, camera.near, camera.far),
    'perspective': () => camera.perspective(camera.fov, camera.aspect, camera.near, camera.far)
}
f.add(camera, 'near', -100, 100).onChange(()=> camera.type === 1 ? buttons.perspective() : buttons.ortho())
f.add(camera, 'far', 0, 1000).onChange(()=> camera.type === 1 ? buttons.perspective() : buttons.ortho())
f.add(buttons, 'perspective')
f.add(camera, 'fov', 1, 179).onChange(buttons.perspective)
f.add(buttons, 'ortho')
f.add(camera, 'frustumSize', 1, 1000).listen().onChange(buttons.ortho)
f.open()