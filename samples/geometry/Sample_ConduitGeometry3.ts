import { BitmapTexture2D, BlendMode, Color, Engine3D, ExtrudeGeometry, LitMaterial, MeshRenderer, Object3D, Object3DUtil, Scene3D, Vector3 } from "@orillusion/core";
import { createExampleScene, createSceneParam } from "@samples/utils/ExampleScene";
import { UVMoveComponent } from "@samples/material/script/UVMoveComponent";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";

// An sample to use ExtrudeGeometry and make uv move animation
class Sample_ConduitGeometry3 {

    scene: Scene3D;
    material: LitMaterial;
    totalTime: number;

    async run() {
        GUIHelp.init();
        Engine3D.setting.shadow.shadowBound = 50;
        let param = createSceneParam();
        param.camera.distance = 50;
        await Engine3D.init();
        let exampleScene = createExampleScene(param);
        this.scene = exampleScene.scene;
        Engine3D.startRenderView(exampleScene.view);
        await this.createMaterial();

        this.createConduit();
        this.createFloor();
    }

    createFloor() {
        let object3D = Object3DUtil.GetSingleCube(200, 1, 200, 1, 1, 1);
        this.scene.addChild(object3D)
    }

    async createMaterial() {
        this.material = new LitMaterial();
        this.material.cullMode = 'none';
        this.material.depthCompare = 'always';
        this.material.blendMode = BlendMode.ADD;
        this.material.baseColor = new Color(0, 1, 0.5, 1.0);
        this.material.transparent = true;

        let texture = new BitmapTexture2D();
        texture.addressModeU = "repeat";
        texture.addressModeV = "repeat";
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
        renderer.geometry = new ExtrudeGeometry().build(shape, false, curve, 0.2);

        let component = conduitObject3D.addComponent(UVMoveComponent);
        component.speed.set(0, -0.4, 4, 0.5)
        GUIUtil.renderUVMove(component);

    }

    private getShape(): Vector3[] {
        let vertexList: Vector3[] = [];//an area
        const vertexCount = 40;
        for (let i = 0; i < vertexCount; i++) {
            let angle = i * Math.PI * 2 / 23;
            let angle2 = i * Math.PI * 2 / 50;
            let z2 = Math.sin(angle2) * 8 * (Math.random() * 0.1 + 0.9);
            let vertex = new Vector3(
                i + this.random(-0.2, 0.2) - vertexCount * 0.5,
                0,
                Math.sin(angle) + this.random(-1, 1)
            );

            vertex.z += z2;

            vertexList.push(vertex);
        }

        return vertexList;
    }

    private random(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    private getCurve(): Vector3[] {
        let vertexList: Vector3[] = [];
        vertexList.push(new Vector3(0, 0, 0));
        vertexList.push(new Vector3(0, 20, 0));
        return vertexList;
    }
}

new Sample_ConduitGeometry3().run();