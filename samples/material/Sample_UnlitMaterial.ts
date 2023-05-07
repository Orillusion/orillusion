import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, BitmapTexture2D, PointLight, Texture, LambertMaterial, Color, PlaneGeometry, MeshRenderer, Object3DUtil, UnLitMaterial } from "@orillusion/core";

class Sample_UnlitMaterial {
    lightObj3D: Object3D;
    scene: Scene3D;

    async run() {
        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(45, -45, 50);

        await this.initScene(this.scene);

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
            directLight.castShadow = true;
            directLight.intensity = 20;
            scene.addChild(this.lightObj3D);
        }

        // create a unlit plane
        let texture = new BitmapTexture2D();
        await texture.load('gltfs/Demonstration/T_Rollets_BC.jpg');
        this.createObject(scene, texture);
        
        // add a lit sphere
        {
            let sphere = Object3DUtil.Sphere;
            sphere.scaleX = 5;
            sphere.scaleY = 5;
            sphere.scaleZ = 5;
            sphere.y = 10;
            this.scene.addChild(sphere);
        }
        return true;
    }

    private createObject(scene: Scene3D, texture: Texture): Object3D {
        let mat = new UnLitMaterial();
        mat.baseMap = texture;
        mat.baseColor = new Color(1, 1, 1, 1);

        let obj: Object3D = new Object3D();

        let render = obj.addComponent(MeshRenderer);
        render.material = mat;
        render.geometry = new PlaneGeometry(200, 200);
        obj.y = 1;
        scene.addChild(obj);

        return obj;
    }

}

new Sample_UnlitMaterial().run();
