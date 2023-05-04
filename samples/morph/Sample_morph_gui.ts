import { Engine3D } from "../../src/Engine3D";
import { AtmosphericComponent } from "../../src/components/AtmosphericComponent";
import { MorphTargetBlender } from "../../src/components/anim/morphAnim/MorphTargetBlender";
import { MorphTargetFrame } from "../../src/components/anim/morphAnim/MorphTargetFrame";
import { HoverCameraController } from "../../src/components/controller/HoverCameraController";
import { DirectLight } from "../../src/components/lights/DirectLight";
import { Camera3D } from "../../src/core/Camera3D";
import { Scene3D } from "../../src/core/Scene3D";
import { View3D } from "../../src/core/View3D";
import { Entity } from "../../src/core/entities/Entity";
import { Object3D } from "../../src/core/entities/Object3D";
import { webGPUContext } from "../../src/gfx/graphics/webGpu/Context3D";
import { Vector3 } from "../../src/math/Vector3";
import { KelvinUtil } from "../../src/util/KelvinUtil";

/**
 * @root
 *
 */
export class Sample_morph_gui {
    lightObj: Object3D;
    scene: Scene3D;
    static updateFrame: MorphTargetFrame;
    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = true;
        Engine3D.setting.material.materialDebug = false;

        Engine3D.setting.shadow.shadowBound = 200;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.debug = true;

        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;

        await Engine3D.init({
            renderLoop: () => this.loop(),
        });

        this.scene = new Scene3D();
        this.scene.addComponent(AtmosphericComponent);

        let cameraObj = new Object3D();
        cameraObj.name = `cameraObj`;
        let mainCamera = cameraObj.addComponent(Camera3D);
        this.scene.addChild(cameraObj);

        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        mainCamera.object3D.addComponent(HoverCameraController).setCamera(0, 0, 200);

        await this.initScene();
        await this.initMorphModel();
        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;



        Engine3D.startRenderView(view);
    }

    private influenceData: { [key: string]: number } = {};

    async initScene() {
        this.lightObj = new Object3D();
        this.lightObj.rotationX = 21;
        this.lightObj.rotationY = 108;
        this.lightObj.rotationZ = 10;
        let lc = this.lightObj.addComponent(DirectLight);
        lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
        lc.castShadow = true;
        lc.intensity = 25;
        this.scene.addChild(this.lightObj);
    }

    private player: Object3D;
    private face: Object3D;
    private async initMorphModel() {
        let player = await Engine3D.res.loadGltf('mt/girl_blendShape/girl_blendShape.gltf');
        player.localScale = new Vector3(100, 100, 100);
        this.player = player;
        this.face = this.player.entityChildren[0] as Object3D;
        this.face.x = this.face.z = 0;
        this.face.y = -1.45;
        this.scene.addChild(player);

        let blendShapeComponent = this.player.addComponent(MorphTargetBlender);
        let targetRenderers = blendShapeComponent.cloneMorphRenderers();

        for (let key in targetRenderers) {
            this.influenceData[key] = 0.0;
        }
        this.logObj(player);

    }


    private logObj(obj: Entity, pre: string = '') {
        console.log(pre, obj.name);

        pre += '== ';
        for (let child of obj.entityChildren) {
            this.logObj(child, pre);
        }
    }



    loop() { }
}
