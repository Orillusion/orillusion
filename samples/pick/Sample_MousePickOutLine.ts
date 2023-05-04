import { Object3D, Camera3D, Scene3D, HoverCameraController, Color, Engine3D, AtmosphericComponent, CameraUtil, webGPUContext, View3D, DirectLight, KelvinUtil, SphereGeometry, LitMaterial, MeshRenderer, ColliderComponent, PointerEvent3D, outlinePostManager } from "@orillusion/core";
import { Scene3DStartComponent } from "@samples/pick/coms/Scene3DStartComponent";

export class Sample_MousePickOutLine {
    lightObj: Object3D;
    cameraObj: Camera3D;
    scene: Scene3D;
    hover: HoverCameraController;

    selectColor: Color;
    highLightColor: Color;

    constructor() {
        this.selectColor = new Color(1.0, 0, 0.0, 3.0);
        this.selectColor.convertToHDRRGB();

        this.highLightColor = new Color(0.0, 1.0, 1.0, 3);
        this.highLightColor.convertToHDRRGB();
    }

    async run() {
        Engine3D.setting.pick.enable = true;
        Engine3D.setting.pick.mode = `pixel`;
        Engine3D.setting.render.postProcessing.outline.outlinePixel = 1;
        Engine3D.setting.render.postProcessing.outline.fadeOutlinePixel = 4;
        Engine3D.setting.render.postProcessing.outline.strength = 0.25;
        await Engine3D.init({});

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, webGPUContext.aspect, 1, 5000.0);

        this.hover = camera.object3D.addComponent(HoverCameraController);
        this.hover.setCamera(-45, -45, 120);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = camera;


        //

        Engine3D.startRenderView(view);

        this.initPickObject(this.scene);
        this.scene.addComponent(Scene3DStartComponent);
    }

    private initPickObject(scene: Scene3D): void {
        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.x = 0;
            this.lightObj.y = 30;
            this.lightObj.z = -40;
            this.lightObj.rotationX = 115;
            this.lightObj.rotationY = 200;
            this.lightObj.rotationZ = 160;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 2;
            lc.debug();
            scene.addChild(this.lightObj);
        }

        this.scene.exposure = 0.5;

        let size: number = 9;
        // let shape = new BoxColliderShape();
        // shape.setFromCenterAndSize(new Vector3(), new Vector3(size, size, size));

        let geometry = new SphereGeometry(size / 2, 20, 20);
        for (let i = 0; i < 10; i++) {
            let obj = new Object3D();
            obj.name = 'sphere ' + i;
            scene.addChild(obj);
            obj.x = (i - 5) * 10;

            let mat = new LitMaterial();
            mat.emissiveMap = Engine3D.res.grayTexture;
            mat.emissiveIntensity = 0.0;

            let renderer = obj.addComponent(MeshRenderer);
            renderer.geometry = geometry;
            renderer.material = mat;
            obj.addComponent(ColliderComponent);
            // obj.addEventListener(PointerEvent3D.PICK_UP, this.onUp, this);
            // obj.addEventListener(PointerEvent3D.PICK_DOWN, this.onDow, this);
            // obj.addEventListener(PointerEvent3D.PICK_CLICK, this.onPick, this);
            // obj.addEventListener(PointerEvent3D.PICK_OVER, this.onOver, this);
            // obj.addEventListener(PointerEvent3D.PICK_OUT, this.onOut, this);
            // obj.addEventListener(PointerEvent3D.PICK_MOVE, this.onMove, this);
        }

        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_UP, this.onUp, this);
        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_DOWN, this.onDow, this);
        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onPick, this);
        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_OVER, this.onOver, this);
        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_OUT, this.onOut, this);
        Engine3D.views[0].pickFire.addEventListener(PointerEvent3D.PICK_MOVE, this.onMove, this);
    }

    private onUp(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.clearOutline();
        }
    }

    private onDow(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.setOutline([e.target], this.selectColor);
        }
    }

    private onPick(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.setOutline([e.target], this.selectColor);
        }
    }

    private onOver(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.setOutline([e.target], this.highLightColor);
        }
    }

    private onOut(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.clearOutline();
        }
    }

    private onMove(e: PointerEvent3D) {
        if (e.target) {
            console.log("onMove -> ", e.target.name);
            // console.log("onMove -> pickInfo", e.targetInfo);
            // console.log("onMove -> worldPos", e.targetInfo.worldPos);
        }
    }

    renderUpdate() {
    }
}
