import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, AxisObject, PropertyAnimation, BoxGeometry, LitMaterial, MeshRenderer, PropertyAnimClip, DirectLight, KelvinUtil } from "@orillusion/core";

export class Sample_Animation {
    lightObj: Object3D;
    scene: Scene3D;
    mats: any[];

    constructor() { }

    async run() {
        //
        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(30, -30, 50)
        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;

        Engine3D.startRenderView(view);

        await this.createAnimation();
        this.scene.addChild(new AxisObject(10));
    }

    //创建动画
    private animation: PropertyAnimation;
    private hover: HoverCameraController;
    private async createAnimation() {
        let animationNode = new Object3D();
        animationNode.name = '';

        {
            let box = new Object3D();
            animationNode.addChild(box);
            let debugGeo = new BoxGeometry(5, 5, 5);
            let mat = new LitMaterial();
            mat.baseMap = Engine3D.res.whiteTexture;
            mat.normalMap = Engine3D.res.normalTexture;
            mat.aoMap = Engine3D.res.whiteTexture;
            mat.maskMap = Engine3D.res.createTexture(32, 32, 255.0, 255.0, 0.0, 1);
            mat.emissiveMap = Engine3D.res.blackTexture;
            mat.roughness = 1.0;
            mat.metallic = 0.0;

            let mr = box.addComponent(MeshRenderer);
            mr.geometry = debugGeo;
            mr.material = mat;
        }

        let clipJson = await Engine3D.res.loadJSON('json/anim.json');

        let animation = (this.animation = animationNode.addComponent(PropertyAnimation));
        let animClip = new PropertyAnimClip();
        animClip.parser(clipJson);
        animation.defaultClip = animClip.name;
        animation.autoPlay = false;
        animation.appendClip(animClip);
        this.scene.addChild(animationNode);
    }

    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 46;
            this.lightObj.rotationY = 62;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 1.7;
            scene.addChild(this.lightObj);
        }
        return true;
    }

    loop() { }
}
