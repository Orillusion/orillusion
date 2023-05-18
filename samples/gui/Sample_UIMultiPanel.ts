import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { GUIPanelBinder, sampleUIPanelDispatcher, sampleUIPanelClick } from "./panel/GUIBinder";
import { Camera3D, Scene3D, View3D, Engine3D, Object3DUtil, Object3D, Vector3, WorldPanel, Time, zSorterUtil } from "@orillusion/core";

export class Sample_UIMultiPanel {
    camera: Camera3D;
    scene: Scene3D;
    view: View3D;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.shadowBias = 0.002;
        Engine3D.setting.shadow.shadowBound = 100;

        GUIHelp.init();

        await Engine3D.init({ renderLoop: () => { this.renderUpdate(); } });

        let sceneData = createSceneParam();
        sceneData.camera.distance = 160;
        let exampleScene = createExampleScene(sceneData);
        Engine3D.startRenderView(exampleScene.view);
        this.scene = exampleScene.scene;
        this.camera = exampleScene.camera;
        this.view = exampleScene.view;
        // enable ui canvas 0
        let canvas = exampleScene.view.enableUICanvas();

        let car = await Engine3D.res.loadGltf('gltfs/pbrCar/pbrCar.gltf');
        car.localScale = new Vector3(1.5, 1.5, 1.5);

        this.scene.addChild(car);
        this.scene.addChild(Object3DUtil.GetSingleCube(400, 1, 400, 0.2, 0.2, 0.2));

        await Engine3D.res.loadFont('fnt/0.fnt');
        await Engine3D.res.loadAtlas('atlas/Sheet_atlas.json');

        this.makeUIPanelList();
    }

    private nodeList: GUIPanelBinder[] = [];
    private bindTarget3DRoot: Object3D;

    private makeUIPanelList(): void {
        this.bindTarget3DRoot = new Object3D();
        this.bindTarget3DRoot.y = 50;
        this.scene.addChild(this.bindTarget3DRoot);
        let canvas = this.view.enableUICanvas();

        for (let i = 0; i < 50; i++) {
            //panel
            let panelRoot: Object3D = new Object3D();
            let panel = panelRoot.addComponent(WorldPanel, { billboard: true });
            panel.needSortOnCameraZ = true;
            canvas.addChild(panel.object3D);

            //random position
            let angle = Math.PI * 2 * Math.random();
            let pos = new Vector3();
            pos.set(Math.sin(angle), Math.cos(angle), (Math.random() - 0.5) * 2);
            pos.multiplyScalar(50 * Math.sqrt(Math.random() + 0.25));

            let ball = this.bindTarget3DRoot.addChild(new Object3D()) as Object3D;
            ball.localPosition = pos;

            //binder
            let node = new GUIPanelBinder(ball, panelRoot, i);
            this.nodeList.push(node);
        }


        sampleUIPanelDispatcher.addEventListener(
            sampleUIPanelClick.type,
            (e) => {
                let target = e.data as Object3D;
                let targetPos = this.view.camera.worldToScreenPoint(target.transform.worldPosition);
                let orginPos = this.view.camera.worldToScreenPoint(new Vector3());
                this.isSpeedAdd = targetPos.x > orginPos.x ? 1 : -1;
                this.speedAngle += 50;
                console.log(this.isSpeedAdd);
            },
            this,
        );
    }
    private speedAngle: number = 1;
    private isSpeedAdd: number = 1;

    renderUpdate() {
        if (this.bindTarget3DRoot) {
            this.speedAngle -= 0.2;
            this.speedAngle = Math.max(this.speedAngle, 1);
            this.bindTarget3DRoot.rotationY += 0.01 * this.speedAngle * this.isSpeedAdd;

            for (let binder of this.nodeList) {
                binder.update(Time.delta);
            }
        }
    }
}
