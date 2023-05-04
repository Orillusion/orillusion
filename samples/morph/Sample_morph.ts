import { Object3D, Scene3D, HoverCameraController, Engine3D, AtmosphericComponent, Camera3D, webGPUContext, View3D, MeshRenderer, DirectLight, KelvinUtil, RendererMask } from "@orillusion/core";

/**
 * @root
 *
 */
export class Sample_morph {
    lightObj: Object3D;
    scene: Scene3D;
    hoverCameraController: HoverCameraController;

    constructor() { }

    async run() {
        Engine3D.setting.material.materialChannelDebug = false;
        Engine3D.setting.shadow.enable = true;
        Engine3D.setting.shadow.debug = false;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.render.postProcessing.ssr.pixelRatio = 1;
        Engine3D.setting.render.postProcessing.ssr.roughnessThreshold = 0.3;

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
        this.hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        this.hoverCameraController.setCamera(0, 0, 110);

        await this.initScene(this.scene);

        let view = new View3D();
        view.scene = this.scene;
        view.camera = mainCamera;



        Engine3D.startRenderView(view);
    }

    private influenceData: { [key: string]: number } = {};
    private targetRenderers: { [key: string]: MeshRenderer } = {};

    async initScene(scene: Scene3D) {
        {
            let data = await Engine3D.res.loadGltf('morph/playme.glb');
            data.y = -80.0;
            data.x = -30.0
            scene.addChild(data);

            let meshRenders: MeshRenderer[] = this.fetchMorphRenderers(data);
            for (const renderer of meshRenders) {
                renderer.setMorphInfluenceIndex(0, 0);
                for (const key in renderer.geometry.morphTargetDictionary) {
                    this.influenceData[key] = 0;
                    this.targetRenderers[key] = renderer;
                    ;
                }
            }
        }


        /******** light *******/
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 21;
            this.lightObj.rotationY = 108;
            this.lightObj.rotationZ = 10;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 25;
            lc.debug();
            this.scene.addChild(this.lightObj);
        }

        return true;
    }

    /**
     * 将morph的数据绑定到3D显示对象
     * @param data 格式{leftEye:0, rightEye:0.5, mouth:0.3}
     * @param targets 每个morph对象的MeshRender引用
     * @returns
     */
    private track(data: { [key: string]: number }, targets: { [key: string]: MeshRenderer }): void {
        for (let key in targets) {
            let renderer = targets[key];
            let value = data[key];
            renderer.setMorphInfluence(key, value);
        }
    }

    private fetchMorphRenderers(obj: Object3D): MeshRenderer[] {
        let rendererList: MeshRenderer[] = [];
        obj.forChild(child => {
            let mr = child.getComponent(MeshRenderer)
            if (mr && mr.hasMask(RendererMask.MorphTarget))
                rendererList.push(mr)
        })
        return rendererList;
    }

    loop() { }
}
