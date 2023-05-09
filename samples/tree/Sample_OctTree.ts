import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, BitmapTexture2D, PointLight, Texture, LambertMaterial, Color, PlaneGeometry, MeshRenderer, Object3DUtil, UnLitMaterial, UUID, Vector3, SphereGeometry, BoundingBox, PostProcessingComponent, GTAOPost, HDRBloomPost, LitMaterial } from "@orillusion/core";
class Sample_OctTree {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;

    async run() {
        await Engine3D.init({ beforeRender: () => this.beforeRender() });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let mainCamera = CameraUtil.createCamera3DObject(this.scene);

        mainCamera.perspective(60, Engine3D.aspect, 1, 2000.0);
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(45, -45, 300);


        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;

        await this.initScene(this.view);
        Engine3D.startRenderView(this.view);

        let post = this.view.scene.addComponent(PostProcessingComponent);
        post.addPost(GTAOPost);
        post.addPost(HDRBloomPost);
    }

    async initScene(view: View3D) {
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
            view.scene.addChild(this.lightObj3D);
        }
        {
            let size = 100;
            for (let i = 0; i < 1000; i++) {
                let obj = this.createObject(i, view, new Vector3(
                    Math.random() * size - size * 0.5,
                    Math.random() * size - size * 0.5,
                    Math.random() * size - size * 0.5,
                ))
                view.scene.addChild(obj);
            }
        }
        return true;
    }

    private _list: Object3D[] = [];

    private createObject(index: number, view: View3D, pos: Vector3): Object3D {
        let mat = new LitMaterial();
        mat.baseColor = Color.random();
        mat.emissiveMap = Engine3D.res.whiteTexture;
        mat.emissiveColor = mat.baseColor;
        mat.emissiveColor.a = 2;
        mat.emissiveColor = mat.emissiveColor;
        mat.emissiveIntensity = 1;
        let obj: Object3D = new Object3D();
        let render = obj.addComponent(MeshRenderer);
        render.material = mat;
        obj.x = pos.x;
        obj.y = pos.y;
        obj.z = pos.z;
        render.geometry = new SphereGeometry(Math.random() * 5 + 1, 35, 35);
        view.scene.addChild(obj);
        // if (obj.bound instanceof BoundingBox) {
        //     // obj.updateBound();
        //     view.graphic3D.drawBoundingBox("aaa" + index, obj.bound, new Color());
        // }
        this._list.push(obj);
        return obj;
    }

    private beforeRender() {
        for (let i = 0; i < this._list.length; i++) {
            const obj = this._list[i];
            if (obj.bound instanceof BoundingBox) {
                // obj.updateBound();
                this.view.graphic3D.drawBoundingBox("aaa" + i, obj.bound);
            }
        }
    }

}

new Sample_OctTree().run();
