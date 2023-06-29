import { BitmapTexture2D, Color, Engine3D, ExtrudeGeometry, GeometryBase, LitMaterial, MeshRenderer, Object3D, Scene3D, SphereGeometry, Vector3 } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { GUIHelp } from "@orillusion/debug/GUIHelp";

// An sample to use ExtrudeGeometry
class Sample_ConduitGeometry {

    scene: Scene3D;
    material: LitMaterial;
    object3Ds: Object3D[];
    isClosedConduit: boolean = true;

    async run() {
        let param = createSceneParam();
        param.camera.distance = 30;
        await Engine3D.init();
        let exampleScene = createExampleScene(param);
        this.scene = exampleScene.scene;
        Engine3D.startRenderView(exampleScene.view);
        await this.createMaterial();

        GUIHelp.init();
        GUIHelp.add(this, 'isClosedConduit').onChange(() => {
            if (this.object3Ds) {
                for (let item of this.object3Ds) {
                    item.removeSelf();
                }
            }
            this.object3Ds = null;

            this.createConduit();
        });
        GUIHelp.open();
        this.createConduit();
    }

    async createMaterial() {
        this.material = new LitMaterial();
        let texture = new BitmapTexture2D();
        texture.addressModeU = "repeat";
        texture.addressModeV = "repeat";
        await texture.load('textures/grid.jpg');
        this.material.baseMap = texture;
    }


    private createConduit() {
        this.object3Ds = [];

        let shape = this.getShape();
        let curve = this.getCurve();
        let conduitObject3D = new Object3D();
        this.scene.addChild(conduitObject3D);

        let renderer = conduitObject3D.addComponent(MeshRenderer);
        renderer.material = this.material;
        let geometry = renderer.geometry = new ExtrudeGeometry().build(shape, this.isClosedConduit, curve, 0.2);

        //
        this.object3Ds.push(conduitObject3D);
        //show vertex point
        for (const item of geometry.sections) {
            for (let i = 0, count = item.rotateShape.length; i < count; i++) {
                let ball = this.showPoint(item.rotateShape[i].add(item.center), i);
                this.object3Ds.push(ball);
            }
        }
    }

    shapeRadius = 1;
    modelRadius = 4;

    private getShape(): Vector3[] {
        let vertexList: Vector3[] = [];//circle
        let radius = this.shapeRadius;
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
        let radius = this.modelRadius;
        const sectionCount = 60;
        for (let i = 0; i < sectionCount; i++) {
            let angle = Math.PI * 2 * i / 20;
            radius += 0.1 * i / sectionCount;
            let offsetY = 0.6 - Math.sqrt(i / sectionCount);
            let point = new Vector3(Math.sin(angle), offsetY * 6, Math.cos(angle)).multiplyScalar(radius);
            vertexList.push(point);
        }
        return vertexList;
    }

    private geo: GeometryBase;
    private mats: LitMaterial[];

    private showPoint(p: Vector3, index: number): Object3D {
        this.geo ||= new SphereGeometry(0.3, 10, 10);
        if (!this.mats) {
            this.mats = [];
            for (let i = 0; i < 40; i++) {
                let mat = new LitMaterial();
                mat.baseColor = Color.random();
                this.mats.push(mat);
            }
        }

        let obj = new Object3D();
        this.scene.addChild(obj);
        let m = obj.addComponent(MeshRenderer);
        m.material = this.mats[index];
        m.geometry = this.geo;

        obj.localPosition = p;

        return obj;
    }
}

new Sample_ConduitGeometry().run();