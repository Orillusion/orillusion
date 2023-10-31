import { AttributeAnimCurve, BitmapTexture2D, BlendMode, BloomPost, Color, Engine3D, ExtrudeGeometry, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PropertyAnimClip, PropertyAnimation, Scene3D, Vector3, WrapMode } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { UVMoveComponent } from "@samples/material/script/UVMoveComponent";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

// An sample to use ExtrudeGeometry and make uv move animation
class Sample_ConduitGeometry2 {

    scene: Scene3D;
    material: LitMaterial;
    animClip: PropertyAnimClip;
    curveX: AttributeAnimCurve;
    curveY: AttributeAnimCurve;
    curveZ: AttributeAnimCurve;
    totalTime: number;

    async run() {
        GUIHelp.init();
        Engine3D.setting.shadow.shadowBound = 50;
        Engine3D.setting.shadow.shadowSize = 1024;
        let param = createSceneParam();
        param.camera.distance = 60;
        await Engine3D.init();
        let exampleScene = createExampleScene(param);
        exampleScene.camera.enableCSM = true;
        this.scene = exampleScene.scene;
        let job = Engine3D.startRenderView(exampleScene.view);
        job.addPost(new BloomPost());
        await this.createMaterial();
        await this.loadCurveData();

        this.bindCurveAnimation();
        this.createConduit();
        this.createFloor();
    }

    createFloor() {
        let object3D = Object3DUtil.GetSingleCube(200, 1, 200, 1, 1, 1);
        object3D.y = -2;
        this.scene.addChild(object3D)
    }

    bindCurveAnimation(): void {
        let obj = Object3DUtil.GetSingleSphere(0.2, 0.8, 0.4, 0.2);
        obj.scaleX = 1.5;
        let holder = new Object3D();
        this.scene.addChild(holder);
        holder.scaleX = holder.scaleY = holder.scaleZ = 5;
        holder.addChild(obj);
        let animation = obj.addComponent(PropertyAnimation);
        animation.autoPlay = true;
        animation.defaultClip = this.animClip.name;
        animation.speed = 0.5;
        animation.appendClip(this.animClip);
    }

    async loadCurveData() {
        // load external curve data
        let json: any = await Engine3D.res.loadJSON('json/anim_0.json');
        this.animClip = new PropertyAnimClip();
        this.animClip.parse(json);
        this.animClip.wrapMode = WrapMode.Loop;
        let curve = this.animClip['objAnimClip']['']['curve'];
        this.curveX = curve['m_LocalPosition.x'];
        this.curveY = curve['m_LocalPosition.y'];
        this.curveZ = curve['m_LocalPosition.z'];
        this.totalTime = this.animClip.totalTime;
    }

    async createMaterial() {
        this.material = new LitMaterial();
        this.material.depthCompare = 'always';
        this.material.blendMode = BlendMode.ADD;
        this.material.baseColor = new Color(0, 1, 0.5, 1.0);
        this.material.transparent = true;

        let texture = new BitmapTexture2D();
        texture.addressModeU = "repeat";
        texture.addressModeV = "repeat";
        // await texture.load('textures/grid.jpg');
        await texture.load('textures/cell.png');
        this.material.baseMap = texture;
    }

    private createConduit() {
        let shape = this.getShape();
        let curve = this.getCurve();
        let conduitObject3D = new Object3D();
        this.scene.addChild(conduitObject3D);

        let renderer = conduitObject3D.addComponent(MeshRenderer);
        renderer.material = this.material;
        renderer.geometry = new ExtrudeGeometry().build(shape, true, curve, 0.2);

        let component = conduitObject3D.addComponent(UVMoveComponent);
        component.speed.set(0, -0.8, 0.5, 0.5)
        GUIUtil.renderUVMove(component);

    }

    private getShape(): Vector3[] {
        let vertexList: Vector3[] = [];//circle
        let radius = 1.2;
        const vertexCount = 8;
        for (let i = 0; i < vertexCount; i++) {
            let angle = Math.PI * 2 * i / vertexCount;
            let point = new Vector3(Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(radius);
            vertexList.push(point);
        }
        return vertexList;
    }

    private getCurve(): Vector3[] {
        let vertexList: Vector3[] = [];
        for (let i = 0; i < this.totalTime; i += 0.05) {
            let point = new Vector3();
            point.x = this.curveX.getValue(i);
            point.y = this.curveY.getValue(i);
            point.z = - this.curveZ.getValue(i);
            point.multiplyScalar(5);
            vertexList.push(point);
        }
        return vertexList;
    }
}

new Sample_ConduitGeometry2().run();