import { Engine3D, Scene3D, AtmosphericComponent, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, View3D, Camera3D, GridObject } from "@orillusion/core";
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
camera.perspective(45, Engine3D.aspect, 1, 5000.0);

// set camera controller
let controller = cameraObj.addComponent(HoverCameraController);
controller.setCamera(0, 0, 30);
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
box.y = 0.5
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
let f = gui.addFolder('Sun')
f.add(sky, "sunX", 0, 1);
f.add(sky, "sunY", 0, 1);
f.open()
let f2 = gui.addFolder('Transform')
f2.add(box.transform, 'x', -20.0, 20.0, 0.01);
f2.add(box.transform, 'y', -20.0, 20.0, 0.01);
f2.add(box.transform, 'z', -20.0, 20.0, 0.01);
f2.add(box.transform, 'rotationX', -180, 180, 0.01);
f2.add(box.transform, 'rotationY', -180, 180, 0.01);
f2.add(box.transform, 'rotationZ', -180, 180.0, 0.01);
f2.add(box.transform, 'scaleX', -2.0, 2.0, 0.01);
f2.add(box.transform, 'scaleY', -2.0, 2.0, 0.01);
f2.add(box.transform, 'scaleZ', -2.0, 2.0, 0.01);
f2.open()