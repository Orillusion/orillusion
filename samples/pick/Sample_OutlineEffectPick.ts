import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { Object3D, Scene3D, Color, Engine3D, OutlinePost, SphereGeometry, LitMaterial, MeshRenderer, ColliderComponent, PointerEvent3D, outlinePostManager } from "@orillusion/core";

class Sample_OutlineEffectPick {
    lightObj: Object3D;
    scene: Scene3D;
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

        Engine3D.setting.render.postProcessing.outline.outlinePixel = 2;
        Engine3D.setting.render.postProcessing.outline.fadeOutlinePixel = 1;
        Engine3D.setting.render.postProcessing.outline.strength = 0.5;

        // init Engine3D
        await Engine3D.init({});

        let exampleScene = createExampleScene();
        this.scene = exampleScene.scene;

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        let job = Engine3D.startRenderView(exampleScene.view);
        job.addPost(new OutlinePost());

        this.initPickObject(this.scene);
    }

    private initPickObject(scene: Scene3D): void {
        let size: number = 9;
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

            // register collider component
            obj.addComponent(ColliderComponent);
        }

        let pickFire = Engine3D.views[0].pickFire;
        // register event
        pickFire.addEventListener(PointerEvent3D.PICK_UP, this.onMouseUp, this);
        pickFire.addEventListener(PointerEvent3D.PICK_DOWN, this.onMouseDown, this);
        pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onMousePick, this);
        pickFire.addEventListener(PointerEvent3D.PICK_OVER, this.onMouseOver, this);
        pickFire.addEventListener(PointerEvent3D.PICK_OUT, this.onMouseOut, this);
        pickFire.addEventListener(PointerEvent3D.PICK_MOVE, this.onMouseMove, this);
    }

    private onMouseUp(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.clearOutline();
        }
    }

    private onMouseDown(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.setOutline([e.target], this.selectColor);
        }
    }

    private onMousePick(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.setOutline([e.target], this.selectColor);
        }
    }

    private onMouseOver(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.setOutline([e.target], this.highLightColor);
        }
    }

    private onMouseOut(e: PointerEvent3D) {
        if (e.target) {
            outlinePostManager.clearOutline();
        }
    }

    private onMouseMove(e: PointerEvent3D) {
        if (e.target) {
            console.log("onMove -> ", e.target.name);
        }
    }

}

new Sample_OutlineEffectPick().run();