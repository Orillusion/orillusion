import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Color, Engine3D, GridObject, Object3D, Object3DUtil, Transform, View3D, } from '@orillusion/core';
import { GUIUtil } from '@samples/utils/GUIUtil';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';
import { Graphic3D } from '@orillusion/graphic';

// A sample to show boundingbox
class Sample_BoundingBox {
    view: View3D;
    box: Object3D;
    container: Object3D;
    graphic3D: Graphic3D
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

        let grid = new GridObject(1000, 100);
        exampleScene.scene.addChild(grid);

        GUIHelp.open();
        GUIUtil.renderTransform(parent.transform, true, 'Container');
        GUIUtil.renderTransform(box.transform, true, 'Box');

        // add a graphic3D to draw lines
        this.graphic3D = new Graphic3D();
        exampleScene.scene.addChild(this.graphic3D);

    }

    logChange() {
        console.log('BoudingBox changed');
    }

    red = new Color(1, 0, 0, 1);
    green = new Color(0, 1, 0, 1);
    loop() {
        this.graphic3D.drawBoundingBox(this.box.instanceID, this.box.bound as any, this.green);
    }
}

new Sample_BoundingBox().run()