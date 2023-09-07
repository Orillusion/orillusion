import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { Scene3D, PropertyAnimation, Engine3D, Object3D, Object3DUtil, PropertyAnimClip, WrapMode, WorldPanel, BillboardType, TextAnchor, UIImage, UIShadow, UITextField, Vector3, Color, Time } from "@orillusion/core";
import { GUIUtil } from "@samples/utils/GUIUtil";

class Sample_POI {
    scene: Scene3D;
    panel: WorldPanel;
    position: Vector3;

    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        Engine3D.setting.shadow.updateFrameRate = 1;
        Engine3D.setting.shadow.shadowBound = 20;
        Engine3D.setting.shadow.csmScatteringExp = 1;

        await Engine3D.init({ renderLoop: () => { this.loop(); } });
        let param = createSceneParam();
        param.camera.distance = 16;
        let exampleScene = createExampleScene(param);

        GUIHelp.init();

        this.scene = exampleScene.scene;
        exampleScene.camera.enableCSM = true;

        Engine3D.startRenderView(exampleScene.view);

        await this.initScene();
        this.initDuckPOI();
        this.initScenePOI();
    }

    private modelContainer: Object3D;

    async initScene() {
        // floor
        let floor: Object3D = Object3DUtil.GetSingleCube(16, 0.1, 16, 1, 1, 1);
        this.scene.addChild(floor);
        await Engine3D.res.loadFont('fnt/0.fnt');

        // load external model
        let model = await Engine3D.res.loadGltf('PBR/Duck/Duck.gltf') as Object3D;
        model.rotationY = 180;
        this.modelContainer = new Object3D();
        this.modelContainer.addChild(model);
        this.scene.addChild(this.modelContainer);
        model.scaleX = model.scaleY = model.scaleZ = 0.01;
        await this.initPropertyAnim(this.modelContainer);

        let chair = await Engine3D.res.loadGltf('PBR/SheenChair/SheenChair.gltf') as Object3D;
        chair.scaleX = chair.scaleY = chair.scaleZ = 8;
        this.scene.addChild(chair);
    }

    private async initPropertyAnim(owner: Object3D) {
        // add PropertyAnimation
        let animation = owner.addComponent(PropertyAnimation);

        //load a animation clip
        let json: any = await Engine3D.res.loadJSON('json/anim_0.json');
        let animClip = new PropertyAnimClip();
        animClip.parse(json);
        animClip.wrapMode = WrapMode.Loop;
        animation.defaultClip = animClip.name;
        animation.autoPlay = true;

        // register clip to animation
        animation.appendClip(animClip);
        animation.play(animation.defaultClip);
        return animation;
    }

    private initDuckPOI() {
        let canvas = this.scene.view.enableUICanvas();
        //panel
        this.panel = new Object3D().addComponent(WorldPanel);
        this.panel.billboard = BillboardType.BillboardXYZ;
        //add to canvas
        canvas.addChild(this.panel.object3D);
        this.panel.object3D.localScale = new Vector3(0.1, 0.1, 0.1);

        //poi
        let panelRoot = new Object3D();

        this.panel.object3D.addChild(panelRoot);

        let image = panelRoot.addComponent(UIImage);
        image.uiTransform.resize(32, 6);
        image.uiTransform.setXY(20, 20);

        image.color = new Color(1, 1, 1, 0.5);
        image.isShadowless = true;
        let text = panelRoot.addComponent(UITextField);

        text.text = 'Happy Duck';
        text.fontSize = 4;
        text.color = new Color(0, 0, 0, 1);
        text.alignment = TextAnchor.MiddleCenter;
        GUIUtil.renderUIPanel(this.panel, true);
    }

    private sceneText: UITextField;
    private initScenePOI() {
        let canvas = this.scene.view.enableUICanvas();
        //panel
        let panel = new Object3D().addComponent(WorldPanel);
        panel.cullMode = "none";
        //add to canvas
        canvas.addChild(panel.object3D);
        panel.object3D.localScale = new Vector3(0.1, 0.1, 0.1);

        //poi
        let panelRoot = new Object3D();
        panel.transform.rotationX = -30;
        panel.transform.y = 3.1;
        panel.transform.x = 1;

        panel.object3D.addChild(panelRoot);
        let text = panelRoot.addComponent(UITextField);
        text.uiTransform.resize(80, 16);
        text.text = this.title;
        text.fontSize = 10;
        text.color = new Color(0.5, 1.0, 0.5, 1.0);
        text.alignment = TextAnchor.MiddleLeft;

        panelRoot.addComponent(UIShadow).shadowOffset.multiplyScaler(0.2);
        this.sceneText = text;
    }

    private charCount = 0;
    private title: string = 'Hello, Orillusion';
    private lastTitle = this.title;
    private loop(): void {
        if (this.panel) {
            this.position ||= new Vector3();
            this.position.copyFrom(this.modelContainer.transform.worldPosition);
            this.panel.object3D.localPosition = this.position;
        }
        if (this.sceneText) {
            let count = 1 + Math.floor(Time.frame * 0.1) % 30;
            if (this.charCount != count) {
                this.charCount = count;
                let newTitle = this.title.slice(0, this.charCount);
                if (newTitle != this.lastTitle) {
                    this.sceneText.text = newTitle;
                    this.lastTitle = newTitle;
                }

            }

        }
    }

}

new Sample_POI().run();