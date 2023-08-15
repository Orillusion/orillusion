import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { BoundingBox, BoxGeometry, Camera3D, Color, Engine3D, Frustum, LitMaterial, MeshRenderer, Object3D, Object3DUtil, PointerEvent3D, Time, Vector3, View3D, } from '@orillusion/core';
import { createExampleScene, createSceneParam } from '@samples/utils/ExampleScene';
import { OctreeEntity } from '../../src/core/tree/octree/OctreeEntity';
import { Octree } from '../../src/core/tree/octree/Octree';
import { GUIUtil } from '@samples/utils/GUIUtil';
import { Stats } from '@orillusion/stats';

// A sample to use octTree
export class Sample_OctTreeFrustum {
    view: View3D;
    entities: OctreeEntity[] = [];
    tree: Octree;
    red = new Color(1, 0, 0, 1);
    gree = new Color(0, 1, 0, 1);
    yellow = new Color(1, 1, 0, 1)
    blue = new Color(0, 0, 1, 1)
    white = new Color(1, 1, 1, 1)

    camera: Camera3D;
    frustumBound: BoundingBox;
    async run() {

        Engine3D.setting.occlusionQuery.octree = { width: 1000, height: 1000, depth: 1000, x: 0, y: 0, z: 0 }

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
        this.view.scene.addComponent(Stats);

        let box: BoundingBox = new BoundingBox();
        box.setFromCenterAndSize(new Vector3(), new Vector3(1000, 1000, 1000));
        this.tree = new Octree(box);

        this.entities = this.initBoxList();
        this.camera = new Object3D().addComponent(Camera3D);
        this.camera.perspective(60, Engine3D.aspect, 1, 1000);
        this.view.scene.addChild(this.camera.object3D);

        this.frustumBound = new BoundingBox();

        GUIUtil.renderTransform(this.camera.transform);
    }

    _material: LitMaterial;

    private initBoxList(): OctreeEntity[] {
        this._material = new LitMaterial();

        let object3D: Object3D;
        let entities: OctreeEntity[] = [];
        let geometry = new BoxGeometry();
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                for (let k = 0; k < 5; k++) {
                    object3D = new Object3D();
                    let renderer = object3D.addComponent(MeshRenderer);
                    renderer.geometry = geometry;
                    renderer.material = this._material;
                    object3D.localPosition.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
                    object3D.localPosition.multiplyScalar(480);
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
        let range = this.camera.frustum.genBox(this.camera.pvMatrixInv);
        this.frustumBound.setFromMinMax(new Vector3(range.minX, range.minY, range.minZ), new Vector3(range.maxX, range.maxY, range.maxZ));
        this.view.graphic3D.drawCameraFrustum(this.camera, this.gree);
        this.view.graphic3D.drawBoundingBox('box', this.frustumBound, this.red);

        let frustum = this.camera.frustum;

        //__________exec octree query
        let now = performance.now();
        this.queryResult.length = 0;
        // this.tree.boxCasts(this.frustumBound, this.queryResult);
        this.tree.frustumCasts(frustum, this.queryResult);

        console.log('exec octree: ', performance.now() - now, 'count', this.queryResult.length);
        //end——————————————

        let retBoolean = {};
        for (let item of this.queryResult) {
            retBoolean[item.uuid] = true;
        }
        for (let item of this.entities) {
            item.renderer.enable = retBoolean[item.uuid];
        }
    }

    loop() {
        this.entities && this.octreeTest();
    }

}
