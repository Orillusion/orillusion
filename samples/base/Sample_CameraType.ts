import { Engine3D, Scene3D, AtmosphericComponent, HoverCameraController, Object3D, MeshRenderer, BoxGeometry, LitMaterial, DirectLight, View3D, Camera3D, GridObject, Frustum, OrbitController, Vector3, Color } from "@orillusion/core";
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
controller.maxDistance = 200;
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
box.y = 0
scene3D.addChild(box);

// create a box
const box2: Object3D = new Object3D();
// add MeshRenderer
let mr2: MeshRenderer = box2.addComponent(MeshRenderer);
// set geometry
mr2.geometry = new BoxGeometry(1, 1, 1);
// set material
mr2.material = new LitMaterial();
mr2.material.baseColor = Color.COLOR_RED
// set rotation
box2.y = 1
box2.x = 1
scene3D.addChild(box2);


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
let options = {
    near: 0.1,
    far: 1000,
    fov: 45,
    frustumSize: 10,
    'ortho': () => {
        options.near = -100
        options.far = 100
        camera.ortho(options.frustumSize, options.near, options.far)
    },
    'perspective': () => {
        options.near = 0.1
        options.far = 1000
        camera.perspective(options.fov, camera.aspect, options.near, options.far)
    }
}
f.add(options, 'near', -100, 100).listen().onChange(()=> {
    camera.type === 1 ? 
    camera.perspective(options.fov, camera.aspect, options.near, options.far) : 
    camera.ortho(options.frustumSize, options.near, options.far)
})
f.add(options, 'far', 0, 1000).listen().onChange(()=> {
    camera.type === 1 ? 
    camera.perspective(options.fov, camera.aspect, options.near, options.far) : 
    camera.ortho(options.frustumSize, options.near, options.far)
})
f.add(options, 'perspective')
f.add(options, 'fov', 1, 179).onChange(()=> camera.perspective(options.fov, camera.aspect, options.near, options.far))
f.add(options, 'ortho')
f.add(options, 'frustumSize', 0.1, 200).onChange(() => camera.ortho(options.frustumSize, options.near, options.far))
f.open()