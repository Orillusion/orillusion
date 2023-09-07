import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { BoundingBox, BoxGeometry, Color, Engine3D, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PointerEvent3D, Time, Vector3, View3D, } from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';
import { OctreeEntity } from '../../src/core/tree/octree/OctreeEntity';
import { Octree } from '../../src/core/tree/octree/Octree';

// A sample to use octTree
export class Sample_OctTreeBox {
    view: View3D;
    entities: OctreeEntity[] = [];
    tree: Octree;
    red = new Color(1, 0, 0, 1);
    green = new Color(0, 1, 0, 1);
    yellow = new Color(1, 1, 0, 1)
    blue = new Color(0, 0, 1, 1)
    white = new Color(1, 1, 1, 1)

    movingBox: BoundingBox;

    async run() {
        // init engine
        await Engine3D.init({ renderLoop: () => { this.loop() } });
        GUIHelp.init();
        let param = createSceneParam();
        param.camera.distance = 400;
        param.camera.near = 0.1;
        param.camera.far = 10000;
        let exampleScene = createExampleScene(param);
        Engine3D.startRenderViews([exampleScene.view]);
        Engine3D.getRenderJob(exampleScene.view);

        this.view = exampleScene.view;

        let box: BoundingBox = new BoundingBox();
        box.setFromMinMax(new Vector3(-100, -100, -100), new Vector3(100, 100, 100));
        this.tree = new Octree(box);

        this.entities = this.initBoxList();
        let center = new Vector3(3, -3, -100);
        let size = new Vector3(200, 137, 134);
        this.movingBox = new BoundingBox().setFromCenterAndSize(center, size);

        let updateBox = () => {
            this.movingBox.setFromCenterAndSize(this.movingBox.center, this.movingBox.size);
        }

        GUIHelp.addFolder('Center');
        GUIHelp.add(this.movingBox.center, 'x', -100, 100, 1).onChange(() => { updateBox(); });
        GUIHelp.add(this.movingBox.center, 'y', -100, 100, 1).onChange(() => { updateBox(); });
        GUIHelp.add(this.movingBox.center, 'z', -100, 100, 1).onChange(() => { updateBox(); });
        GUIHelp.open();
        GUIHelp.endFolder();
        GUIHelp.addFolder('Size');
        GUIHelp.add(this.movingBox.size, 'x', 1, 200, 1).onChange(() => { updateBox(); });
        GUIHelp.add(this.movingBox.size, 'y', 1, 200, 1).onChange(() => { updateBox(); });
        GUIHelp.add(this.movingBox.size, 'z', 1, 200, 1).onChange(() => { updateBox(); });
        GUIHelp.endFolder();
    }

    _material: LitMaterial;

    private initBoxList(): OctreeEntity[] {
        this._material = new LitMaterial();

        let object3D: Object3D;
        let entities: OctreeEntity[] = [];
        let geometry = new BoxGeometry();
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                for (let k = 0; k < 4; k++) {
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
        this.queryResult.length = 0;

        let now: number = Date.now();
        this.tree.boxCasts(this.movingBox, this.queryResult);
        let time: number = Date.now() - now;
        console.log('time: ' + time + ' count: ' + this.queryResult.length);

        let retBoolean = {};
        for (let item of this.queryResult) {
            let enable = this.movingBox.containsBox(item.renderer.object3D.bound as BoundingBox);
            retBoolean[item.uuid] = enable;
        }
        for (let item of this.entities) {
            item.renderer.enable = retBoolean[item.uuid];
        }
        this.view.graphic3D.drawBoundingBox('pick', this.movingBox, this.green);
    }

    loop() {
        this.entities && this.octreeTest();
    }

}
