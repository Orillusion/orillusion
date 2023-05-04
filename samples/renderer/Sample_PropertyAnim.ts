import { Object3D, Scene3D, PropertyAnimation, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, HoverCameraController, View3D, PropertyAnimClip, WrapMode, DirectLight, KelvinUtil, MeshRenderer, LitMaterial, PlaneGeometry } from "@orillusion/core";

export class Sample_PropertyAnim {
    lightObj: Object3D;
    scene: Scene3D;
    private animation: PropertyAnimation;

    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.material.materialDebug = false;
        Engine3D.setting.render.postProcessing.gtao.debug = false;
        Engine3D.setting.render.postProcessing.taa.debug = false;
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowBias = 0.002;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });


        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        mainCamera.perspective(60, webGPUContext.aspect, 1, 2000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(180, -20, 15);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;

        Engine3D.startRenderView(view);
    }

    private async makePropertyAnim(node: Object3D) {
        // 添加组件
        let animation = node.addComponent(PropertyAnimation);

        // 加载clip素材
        let json: any = await Engine3D.res.loadJSON('json/anim_0.json');
        // 初始化clip
        let animClip = new PropertyAnimClip();
        // 解析clip
        animClip.parser(json);
        animClip.wrapMode = WrapMode.Loop;
        animation.defaultClip = animClip.name;
        animation.autoPlay = true;
        // 将clip追加至组件
        animation.appendClip(animClip);
        return animation;
    }

    /**
     * @ch asdasda
     * @en asdasdas
     * @param scene
     * @returns
     */
    async initScene(scene: Scene3D) {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 0;
            this.lightObj.rotationZ = 45;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 10.7;
            scene.addChild(this.lightObj);
        }
        this.createFloor(scene);

        let duck = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
        this.scene.addChild(duck);
        duck.scaleX = duck.scaleY = duck.scaleZ = 0.02;

        let mrs = duck.getComponentsInChild(MeshRenderer);

        mrs.forEach((mr: MeshRenderer) => {
            if (mr.material && mr.material instanceof LitMaterial) {
                mr.material.roughness = 0.05;
            }
        });

        this.animation = await this.makePropertyAnim(duck);
        this.animation.play(this.animation.defaultClip);

        return true;
    }

    private createFloor(scene: Scene3D) {
        let mat = new LitMaterial();
        mat.baseMap = Engine3D.res.whiteTexture;
        mat.normalMap = Engine3D.res.normalTexture;
        mat.aoMap = Engine3D.res.whiteTexture;
        mat.emissiveMap = Engine3D.res.blackTexture;
        mat.roughness = 0.2;
        mat.roughness_max = 0.1;
        mat.metallic = 0.5;

        {
            let planeGeometry = new PlaneGeometry(1000, 1000);
            let floor: Object3D = new Object3D();
            let mr = floor.addComponent(MeshRenderer);
            mr.material = mat;
            mr.geometry = planeGeometry;
            scene.addChild(floor);
        }
    }

    private loop(): void { }
}
