import { Engine3D, ComponentBase, Object3DUtil } from "@orillusion/core";
import { createExampleScene } from "@samples/utils/ExampleScene";

class TestComponent1 extends ComponentBase {
    i = 0;
    start(): void {
        console.log('TestComponent1 start');
    }
    onUpdate() {
        this.i += 1;
        console.log("TestComponent1 onUpdate");
    }
    onLateUpdate() {
        console.log("TestComponent1 onLateUpdate", this.i);
    }
}

class TestComponent2 extends ComponentBase {
    i = 0;
    start() {
        console.log("TestComponent2 start");
        this.transform.rotationY = 0.0;
        this.object3D.addComponent(TestComponent1);
    }
    onUpdate() {
        this.i += 1;
        this.transform.rotationY += 1.0;
        console.log("TestComponent2 onUpdate");
    }
    onLateUpdate() {
        console.log("TestComponent2 onLateUpdate", this.i);
    }
}

Engine3D.setting.shadow.type = 'HARD'
Engine3D.setting.shadow.shadowBound = 100
Engine3D.init().then(() => {
    let exampleScene = createExampleScene();
    //floor
    const floor = Object3DUtil.GetSingleCube(100, 1, 100, 0.5, 0.5, 0.5);
    floor.y = -5;
    exampleScene.scene.addChild(floor);
    // 新建对象
    const obj = Object3DUtil.GetSingleCube(10, 10, 10, 1, 1, 1)
    obj.addComponent(TestComponent2);
    exampleScene.scene.addChild(obj);
    // 开始渲染
    Engine3D.startRenderView(exampleScene.view);
});