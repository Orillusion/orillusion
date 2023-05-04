import { AtmosphericComponent, BoxGeometry, Camera3D, DirectLight, Engine3D, HoverCameraController, KelvinUtil, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D } from '@orillusion/core';
import { Stats } from '@orillusion/stats'
import * as dat from 'https://unpkg.com/dat.gui@0.7.9/build/dat.gui.module.js'

// simple base demo
class Sample_Base_0 {
    async run() {
        // init engine
        await Engine3D.init();
        // create new Scene
        let scene = new Scene3D();

        // add performance stats
        scene.addComponent(Stats)

        // add an Atmospheric sky enviroment
        let sky = scene.addComponent(AtmosphericComponent);
        sky.sunY = 0.6

        // add a camera object
        let cameraObj = new Object3D();
        scene.addChild(cameraObj);

        // set main camera component with a perspective view
        let mainCamera = cameraObj.addComponent(Camera3D);
        mainCamera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        // add a basic camera controller
        let hoverCameraController = cameraObj.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -15, 10);

        // create a basic cube
        let cubeObj = new Object3D();
        let mr = cubeObj.addComponent(MeshRenderer);
        mr.geometry = new BoxGeometry();
        let mat = new LitMaterial();
        mr.material = mat;
        scene.addChild(cubeObj);

        // add a basic direct light
        let lightObj = new Object3D();
        lightObj.rotationX = 45;
        lightObj.rotationY = 60;
        lightObj.rotationZ = 150;
        let lc = lightObj.addComponent(DirectLight);
        lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        lc.intensity = 10;
        scene.addChild(lightObj);

        // create a view with target scene and camera
        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;

        // start render
        Engine3D.startRenderView(view);

        // debug GUI
        const GUIHelp = new dat.GUI({name: 'Orillusion'})
        GUIHelp.addFolder('Transform');
        GUIHelp.add(cubeObj.transform, 'x', -10.0, 10.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'y', -10.0, 10.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'z', -10.0, 10.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'rotationX', 0.0, 360.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'rotationY', 0.0, 360.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'rotationZ', 0.0, 360.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'scaleX', 0.0, 2.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'scaleY', 0.0, 2.0, 0.01);
        GUIHelp.add(cubeObj.transform, 'scaleZ', 0.0, 2.0, 0.01);
        GUIHelp.endFolder();
    }
}

new Sample_Base_0().run()