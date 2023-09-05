import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Color, Engine3D, Object3D, Object3DUtil, Transform, View3D, } from '@orillusion/core';
import { GUIUtil } from '@samples/utils/GUIUtil';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';

// A sample to show boundingbox
class Sample_BoundingBox {
    view: View3D;
    box: Object3D;
    container: Object3D;
    async run() {
        // init engine
        await Engine3D.init({ renderLoop: () => { this.loop() } });
        GUIHelp.init();
        let param = createSceneParam();
        param.camera.near = 0.01;
        param.camera.far = 1000;
        param.camera.distance = 20;
        let exampleScene = createExampleScene(param);
        Engine3D.startRenderViews([exampleScene.view]);
        Engine3D.getRenderJob(exampleScene.view);

        let box = Object3DUtil.GetSingleCube(5, 3, 8, 1, 1, 1);
        box.transform.eventDispatcher.addEventListener(Transform.LOCAL_ONCHANGE, this.logChange, this);

        this.box = box;
        this.view = exampleScene.view;

        let parent = this.container = new Object3D();
        parent.addChild(box);
        exampleScene.scene.addChild(parent);

        GUIHelp.open();
        GUIHelp.addButton('Remove Box', () => { box.transform.parent && box.removeFromParent(); })
        GUIHelp.addButton('Add Box', () => { !box.transform.parent && parent.addChild(box); })

        GUIUtil.renderTransform(parent.transform, true, 'Container');
        GUIUtil.renderTransform(box.transform, true, 'Box');

    }

    logChange() {
        console.log('BoudingBox changed');
    }

    red = new Color(1, 0, 0, 1);
    green = new Color(0, 1, 0, 1);
    loop() {
        this.view.graphic3D.drawBoundingBox(this.box.instanceID, this.box.bound as any, this.green);
        this.view.graphic3D.drawBoundingBox(this.container.instanceID, this.container.bound as any, this.red);
    }
}

new Sample_BoundingBox().run()