import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, BitmapTexture2D, Color, PlaneGeometry, MeshRenderer, UnLitMaterial, SphereGeometry, LitMaterial } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

class Sample_UnlitMaterial {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        await Engine3D.init();

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(45, -45, 50);

        await this.initScene(this.scene);
        sky.relativeTransform = this.lightObj3D.transform;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.x = 0;
            this.lightObj3D.y = 30;
            this.lightObj3D.z = -40;
            this.lightObj3D.rotationX = 46;
            this.lightObj3D.rotationY = 62;
            this.lightObj3D.rotationZ = 0;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.intensity = 20;
            scene.addChild(this.lightObj3D);
        }

        // create a unlit plane
        {
            let texture = new BitmapTexture2D();
            await texture.load('textures/grid.jpg');
            let mat = new UnLitMaterial();
            mat.baseMap = texture;
            mat.baseColor = new Color(1, 1, 1, 1);

            let obj: Object3D = new Object3D();

            let render = obj.addComponent(MeshRenderer);
            render.material = mat;
            render.geometry = new PlaneGeometry(100, 100);
            obj.y = 1;
            scene.addChild(obj);
        }
        // add a unlit sphere
        {
            let sphere = new Object3D();
            let renderer = sphere.addComponent(MeshRenderer);
            renderer.geometry = new SphereGeometry(1, 32, 32);
            renderer.material = new UnLitMaterial()
            sphere.scaleX = 5;
            sphere.scaleY = 5;
            sphere.scaleZ = 5;
            sphere.y = 10;
            sphere.x = -10;
            this.scene.addChild(sphere);
        }
        // add a lit sphere
        {
            let sphere = new Object3D();
            let renderer = sphere.addComponent(MeshRenderer);
            renderer.geometry = new SphereGeometry(1, 32, 32);
            renderer.material = new LitMaterial()
            sphere.scaleX = 5;
            sphere.scaleY = 5;
            sphere.scaleZ = 5;
            sphere.y = 10;
            sphere.x = 10;
            this.scene.addChild(sphere);
        }
        return true;
    }
}

new Sample_UnlitMaterial().run();
