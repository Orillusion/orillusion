import { RenderNode } from '../../../components/renderer/RenderNode';
import { Camera3D } from '../../../core/Camera3D';
import { Scene3D } from '../../../core/Scene3D';
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

    constructor() {
        this._renderList = new Map<Camera3D, Map<RenderNode, number>>();
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
        // EntityCollect.instance.autoSortRenderNodes(scene);
        let nodes = EntityCollect.instance.getRenderNodes(scene);

        // if (nodes.opaqueList) {
        //     for (let i = 0; i < nodes.opaqueList.length; i++) {
        //         const node = nodes.opaqueList[i];
        //         // cameraViewRenderList.set(node, 1);

        //         let inRender = 0;

        //         if (node.enable && node.transform.enable && node.object3D.bound) {
        //             inRender = node.object3D.bound.containsFrustum(node.object3D, camera.frustum);
        //         }

        //         if (inRender) {
        //             cameraViewRenderList.set(node, inRender);
        //         }
        //     }
        // }

        // if (nodes.transparentList) {
        //     for (let i = 0; i < nodes.transparentList.length; i++) {
        //         const node = nodes.transparentList[i];
        //         // cameraViewRenderList.set(node, 1);

        //         let inRender = 0;
        //         if (node.enable && node.transform.enable && node.object3D.bound) {
        //             inRender = node.object3D.bound.containsFrustum(node.object3D, camera.frustum);
        //         }

        //         if (inRender) {
        //             cameraViewRenderList.set(node, inRender);
        //         }
        //     }
        // }
    }

    renderCommitTesting(camera: Camera3D, renderNode: RenderNode): boolean {
        return true;
        // if (!OcclusionSystem.enable) return true;
        // let cameraRenderList = this._renderList.get(camera);
        // if (cameraRenderList) {
        //     return this._renderList.get(camera).get(renderNode) > 0;
        // } else {
        //     return false;
        // }
    }
}
