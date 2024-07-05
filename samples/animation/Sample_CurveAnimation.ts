import { Object3D, Scene3D, AnimationCurve, Engine3D, AtmosphericComponent, CameraUtil, HoverCameraController, View3D, DirectLight, KelvinUtil, Keyframe, Object3DUtil, Time, PostProcessingComponent, FXAAPost, GBufferPost } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

export class Sample_AnimCurve {
    lightObj3D: Object3D;
    scene: Scene3D;
    Duck: Object3D;
    curve1: AnimationCurve;
    curve2: AnimationCurve;
    curve3: AnimationCurve;
    curve4: AnimationCurve;

    async run() {

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 150;
        Engine3D.setting.shadow.shadowBias = 0.02;

        GUIHelp.init();
        await Engine3D.init({ renderLoop: () => { this.renderUpdate() } });

        this.scene = new Scene3D();
        let sky = this.scene.addComponent(AtmosphericComponent);

        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 0.01, 5000.0);

        let ctrl = camera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(0, -45, 200);
        ctrl.maxDistance = 1000;

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        let postCom = this.scene.addComponent(PostProcessingComponent);
        postCom.addPost(FXAAPost);
        let post = postCom.addPost(GBufferPost);
        GUIUtil.renderGBufferPost(post);

        await this.initScene();
        sky.relativeTransform = this.lightObj3D.transform;
    }

    async initScene() {
        /******** light *******/
        {
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 35;
            this.lightObj3D.rotationY = 110;
            this.lightObj3D.rotationZ = 0;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = true;
            directLight.intensity = 3;
            this.scene.addChild(this.lightObj3D);

            GUIUtil.renderDirLight(directLight);

            //create animation curve 1
            this.curve1 = new AnimationCurve();
            this.curve1.addKeyFrame(new Keyframe(0, 1));
            this.curve1.addKeyFrame(new Keyframe(0.5, 2));
            this.curve1.addKeyFrame(new Keyframe(0.7, 2));
            this.curve1.addKeyFrame(new Keyframe(1.0, 1));

            //create animation curve 2

            this.curve2 = new AnimationCurve();
            this.curve2.addKeyFrame(new Keyframe(0, 0));
            this.curve2.addKeyFrame(new Keyframe(1, 360));

            //create animation curve 3
            this.curve3 = new AnimationCurve();
            this.curve3.addKeyFrame(new Keyframe(0, -5));
            this.curve3.addKeyFrame(new Keyframe(0.3, 3));
            this.curve3.addKeyFrame(new Keyframe(0.6, 8));
            this.curve3.addKeyFrame(new Keyframe(0.9, -2));
            this.curve3.addKeyFrame(new Keyframe(1.0, -5));

            //create animation curve 4
            this.curve4 = new AnimationCurve();
            this.curve4.addKeyFrame(new Keyframe(0, 1));
            this.curve4.addKeyFrame(new Keyframe(0.3, -9));
            this.curve4.addKeyFrame(new Keyframe(0.6, -2));
            this.curve4.addKeyFrame(new Keyframe(0.9, 2));
            this.curve4.addKeyFrame(new Keyframe(1.0, 1));

        }

        this.scene.addChild(Object3DUtil.GetSingleCube(300, 5, 300, 1, 1, 1));
        // load a gltf model
        this.Duck = (await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf')) as Object3D;
        this.Duck.scaleX = this.Duck.scaleY = this.Duck.scaleZ = 0.3;
        this.Duck.name = "Duck"
        this.scene.addChild(this.Duck);
    }

    renderUpdate() {
        //modify animation attribute values to the model
        if (this.Duck) {
            let time = (Time.time * 0.4 % (1000) / 1000);
            this.Duck.y = this.curve1.getValue(time) * 5;
            this.Duck.x = this.curve3.getValue(time) * 5 - 2.5;
            this.Duck.z = this.curve4.getValue(time) * 5 - 2.5;
            this.Duck.rotationY = this.curve2.getValue(time);
        }
    }
}
