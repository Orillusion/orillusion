import { AtmosphericComponent, BloomPost, BoxGeometry, CameraUtil, DirectLight, Engine3D, GTAOPost, HoverCameraController, KelvinUtil, LambertMaterial, LitMaterial, MeshRenderer, Object3D, OcclusionSystem, PlaneGeometry, PostProcessingComponent, Quaternion, Scene3D, SphereGeometry, UnLitMaterial, Vector3, Vector3Ex, View3D } from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats';
import { GUIUtil } from '@samples/utils/GUIUtil';

// sample use component
export class Sample_InitEngine {
    view: View3D;
    async run() {

        OcclusionSystem.enable = false;
        Engine3D.setting.shadow.shadowBound = 256
        Engine3D.setting.render.useLogDepth = true
        // init engine
        await Engine3D.init({ renderLoop: () => this.update() });

        // create new Scene
        let scene = new Scene3D();
        // add atmospheric sky
        scene.addComponent(AtmosphericComponent).sunY = 0.6;
        scene.addComponent(Stats);

        // init camera3D 
        let mainCamera = CameraUtil.createCamera3D(null, scene);
        mainCamera.perspective(60, Engine3D.aspect, 0.1, 6500000 * 4);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(15, -30, 6500000 * 2);

        // create a view with target scene and camera
        this.view = new View3D();
        this.view.scene = scene;
        this.view.camera = mainCamera;

        GUIHelp.init();

        // start render
        Engine3D.startRenderView(this.view);

        let postCom = scene.addComponent(PostProcessingComponent);
        let post = postCom.addPost(BloomPost) as BloomPost;
        let post2 = postCom.addPost(GTAOPost) as GTAOPost;

        GUIUtil.renderBloom(post);
        GUIUtil.renderShadowSetting();
        await this.test();
    }

    private async test() {

        /******** light *******/
        {
            let lightObj3D = new Object3D();
            lightObj3D.x = 0;
            lightObj3D.y = 30;
            lightObj3D.z = -40;
            lightObj3D.rotationX = 45;
            lightObj3D.rotationY = 0;
            lightObj3D.rotationZ = 0;
            let directLight = lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 140;
            this.view.scene.addChild(lightObj3D);

            GUIUtil.renderDirLight(directLight, true);
        }
        {
            let sphere = new SphereGeometry(6300000, 120, 120);
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = sphere;
            mr.material = new LitMaterial();
            this.view.scene.addChild(floor);
        }
        {
            let floorGeo = new PlaneGeometry(100, 100, 10, 10);
            let floor = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.geometry = floorGeo;
            mr.material = new LitMaterial();
            this.view.scene.addChild(floor);
        }

        // let shareGeometry = new BoxGeometry();
        // let mat = new LitMaterial();

        // let count = 100 * 1000;
        // let count = 1 * 1000;
        // for (let i = 0; i < count; i++) {
        //     let box = new Object3D();
        //     let mr = box.addComponent(MeshRenderer);
        //     mr.geometry = shareGeometry;
        //     mr.material = mat;
        //     mr.castShadow = true;
        //     box.scaleX = 2;
        //     box.scaleY = 2;
        //     box.scaleZ = 2;

        //     box.rotationX = Math.random() * 360;
        //     box.rotationY = Math.random() * 360;
        //     box.rotationZ = Math.random() * 360;

        //     this.updateList.push(box);

        //     box.localPosition = Vector3Ex.sphereXYZ(10, 300, 1, 1, 1);
        //     this.view.scene.addChild(box);
        // }
    }

    public updateList: Object3D[] = [];
    public update() {
        for (let i = 0; i < this.updateList.length; i++) {
            const obj = this.updateList[i];
            obj.transform.rotationY += 1;
        }
    }
}
