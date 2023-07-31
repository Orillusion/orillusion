import { RenderNode } from '../../../components/renderer/RenderNode';
import { BoundingBox } from '../../../core/bound/BoundingBox';
import { Camera3D } from '../../../core/Camera3D';
import { Scene3D } from '../../../core/Scene3D';
import { OctreeEntity } from '../../../core/tree/octree/OctreeEntity';
import { Engine3D } from '../../../Engine3D';
import { EntityCollect } from '../collect/EntityCollect';
/**
 * @internal
 * @group Post
 */
export class OcclusionSystem {
    public frustumCullingList: Float32Array;
    public zVisibleList: Float32Array;
    private _renderList: Map<Camera3D, Map<RenderNode, number>>;

    public static enable = true;
    private _frustumBound: BoundingBox;

    constructor() {
        this._renderList = new Map<Camera3D, Map<RenderNode, number>>();
        this._frustumBound = new BoundingBox();
    }

    /**
     * Get GPU Test Occlusion test
     * @param index
     * @returns
     */
    public occlusionRenderNodeTest(index: number): number {
        if (!Engine3D.setting.occlusionQuery.enable) return 1;
        if (this.frustumCullingList) {
            return this.frustumCullingList[index];
        } else {
            return 0;
        }
    }

    /**
     * Get GPU Pixel depth visible Test
     * @param index
     * @returns
     */
    public zDepthRenderNodeTest(index: number): number {
        if (this.zVisibleList) {
            return this.zVisibleList[index];
        } else {
            return 0;
        }
    }

    public update(camera: Camera3D, scene: Scene3D) {
        if (!OcclusionSystem.enable) return;
        let cameraViewRenderList = this._renderList.get(camera);
        if (!cameraViewRenderList) {
            cameraViewRenderList = new Map<RenderNode, number>();
            this._renderList.set(camera, cameraViewRenderList);
        }
        cameraViewRenderList.clear();
        EntityCollect.instance.autoSortRenderNodes(scene);
        // let nodes = EntityCollect.instance.getRenderNodes(scene);

        let collectInfo = EntityCollect.instance.getRenderNodes(scene);
        if (Engine3D.setting.occlusionQuery.octree) {
            let opaqueList: OctreeEntity[] = [];
            let transparentList: OctreeEntity[] = [];
            // let now = performance.now();
            // {
            //     let range = camera.frustum.genBox(camera.pvMatrixInv);
            //     this._frustumBound.min.set(range.minX, range.minY, range.minZ);
            //     this._frustumBound.max.set(range.maxX, range.maxY, range.maxZ);
            //     this._frustumBound.setFromMinMax(this._frustumBound.min, this._frustumBound.max);
            //     collectInfo.opTree.boxCasts(this._frustumBound, fillterList);
            //     collectInfo.trTree.boxCasts(this._frustumBound, fillterList);
            // }

            collectInfo.opaqueList = [];
            collectInfo.transparentList = [];
            collectInfo.opTree.frustumCasts(camera.frustum, opaqueList);
            collectInfo.trTree.frustumCasts(camera.frustum, transparentList);

            // console.log('cast', performance.now() - now, fillterList.length);
            for (let item of opaqueList) {
                cameraViewRenderList.set(item.renderer, 1);
                collectInfo.opaqueList.push(item.renderer);
            }
            for (let item of transparentList) {
                cameraViewRenderList.set(item.renderer, 1);
                collectInfo.transparentList.push(item.renderer);
            }
        } else {
            // let now = performance.now();
            for (let node of collectInfo.opaqueList) {
                let inRender = 0;

                if (node.enable && node.transform.enable) {
                    inRender = camera.frustum.containsBox(node.object3D.bound);
                }

                if (inRender) {
                    cameraViewRenderList.set(node, inRender);
                }
            }

            for (let node of collectInfo.transparentList) {
                let inRender = 0;
                if (node.enable && node.transform.enable) {
                    inRender = camera.frustum.containsBox(node.object3D.bound);
                }

                if (inRender) {
                    cameraViewRenderList.set(node, inRender);
                }
            }
            // console.log('cast', performance.now() - now);

        }
    }

    renderCommitTesting(camera: Camera3D, renderNode: RenderNode): boolean {
        if (!OcclusionSystem.enable) return true;
        let cameraRenderList = this._renderList.get(camera);
        if (cameraRenderList) {
            return this._renderList.get(camera).get(renderNode) > 0;
        } else {
            return false;
        }
    }
}
