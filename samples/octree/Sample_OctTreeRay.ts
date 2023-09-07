import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { BoundingBox, BoxGeometry, Color, Engine3D, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PointerEvent3D, Time, Vector3, View3D, } from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';
import { OctreeEntity } from '../../src/core/tree/octree/OctreeEntity';
import { Octree } from '../../src/core/tree/octree/Octree';

// A sample to use octTree
export class Sample_OctTreeRay {
    view: View3D;
    entities: OctreeEntity[] = [];
    tree: Octree;
    red = new Color(1, 0, 0, 1);
    green = new Color(0, 1, 0, 1);
    yellow = new Color(1, 1, 0, 1)
    blue = new Color(0, 0, 1, 1)
    white = new Color(1, 1, 1, 1)

    async run() {
        Engine3D.setting.shadow.enable = false;
        Engine3D.setting.occlusionQuery.octree = { width: 400, height: 400, depth: 400, x: 0, y: 0, z: 0 }
        // init engine
        await Engine3D.init({ renderLoop: () => { this.loop() } });
        GUIHelp.init();
        let param = createSceneParam();
        param.camera.distance = 400;
        param.camera.near = 0.1;
        param.camera.far = 10000;
        let exampleScene = createExampleScene(param);
        exampleScene.light.castShadow = false;
        Engine3D.startRenderViews([exampleScene.view]);
        Engine3D.getRenderJob(exampleScene.view);

        this.view = exampleScene.view;

        let box: BoundingBox = new BoundingBox();
        box.setFromCenterAndSize(new Vector3(), new Vector3(400, 400, 400));
        this.tree = new Octree(box);

        this.entities = this.initBoxList();
    }

    _material: LitMaterial;

    private initBoxList(): OctreeEntity[] {
        this._material = new LitMaterial();

        let object3D: Object3D;
        let entities: OctreeEntity[] = [];
        let geometry = new BoxGeometry();
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                for (let k = 0; k < 2; k++) {
                    object3D = new Object3D();
                    let renderer = object3D.addComponent(MeshRenderer);
                    renderer.geometry = geometry;
                    renderer.material = this._material;
                    object3D.localPosition.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
                    object3D.localPosition.multiplyScalar(190);
                    object3D.localPosition = object3D.localPosition;
                    object3D.localScale = new Vector3(1 + Math.random(), 1 + Math.random(), 1 + Math.random());
                    object3D.name = 'name' + i;

                    let entity: OctreeEntity = new OctreeEntity(renderer);
                    entities.push(entity);
                    this.tree.tryInsertEntity(entity);
                    this.view.scene.addChild(object3D);
                }
            }
        }
        return entities;
    }


    private queryResult: OctreeEntity[] = [];
    private octreeTest() {
        let ray = this.view.camera.screenPointToRay(Engine3D.inputSystem.mouseX, Engine3D.inputSystem.mouseY);
        this.queryResult.length = 0;
        let now: number = Date.now();
        this.tree.rayCasts(ray, this.queryResult);
        let time: number = Date.now() - now;
        console.log('time: ' + time + ' count: ', this.queryResult.length);
        this.view.graphic3D.ClearAll();

        let retBoolean = {};
        let boundList = {};
        for (let item of this.queryResult) {
            if (ray.intersectBox(item.renderer.object3D.bound)) {
                retBoolean[item.uuid] = true;
                boundList[item.owner.uuid] = item.owner;
            }
        }
        for (let item of this.entities) {
            item.renderer.enable = !retBoolean[item.uuid];
        }

        //show box
        for (let key in boundList) {
            let tree = boundList[key];
            this.view.graphic3D.drawBoundingBox(key, tree.box, this.green);
        }
    }

    loop() {
        this.entities && this.updateBoxTransform();
    }

    private counter: number = 0;
    private updateBoxTransform() {
        this.octreeTest();
        this.counter += Time.delta;
        if (this.counter > 4000) {
            this.counter = 0;
            let obj: Object3D;
            for (const entity of this.entities) {
                obj = entity.renderer.object3D;
                if (Math.random() < 0.1) {
                    obj.localPosition.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
                    obj.localPosition.multiplyScalar(190);
                    obj.localPosition = obj.localPosition;
                    entity.update(this.tree);
                }
            }
        }
    }
}
