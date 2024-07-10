
import { View3D } from '../../core/View3D';
import { BoundingBox } from '../../core/bound/BoundingBox';
import { EntityCollect } from '../../gfx/renderJob/collect/EntityCollect';
import { ClusterLightingBuffer } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer';
import { RendererMask } from '../../gfx/renderJob/passRenderer/state/RendererMask';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { PassType } from '../../gfx/renderJob/passRenderer/state/PassType';
import { Vector3 } from '../../math/Vector3';
import { RenderNode } from './RenderNode';
import { mergeFunctions } from '../../util/Global';

/**
 *
 * Sky Box Renderer Component
 * @group Components
 */
export class Reflection extends RenderNode {
    public gid: number = 0;
    public needUpdate: boolean = true;
    public autoUpdate: boolean = false;
    public radius: number = 500;
    public init(): void {
        super.init();
        this.addRendererMask(RendererMask.Reflection);
        this.alwaysRender = true;
        this.object3D.bound = new BoundingBox(Vector3.ZERO.clone(), Vector3.MAX);

        mergeFunctions(this.transform.onPositionChange, () => {
            this.needUpdate = true;
        });
    }

    public onEnable(): void {
        EntityCollect.instance.addRenderNode(this.transform.scene3D, this);
    }

    public onDisable(): void {
        EntityCollect.instance.removeRenderNode(this.transform.scene3D, this);
    }

    public renderPass2(view: View3D, passType: PassType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle: boolean = false) {
        super.renderPass2(view, passType, rendererPassState, clusterLightingBuffer, encoder, useBundle);
    }

}
