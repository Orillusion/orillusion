import { Engine3D } from "../../../../Engine3D";
import { RenderNode } from "../../../../components/renderer/RenderNode";
import { View3D } from "../../../../core/View3D";
import { GlobalBindGroup } from "../../../graphics/webGpu/core/bindGroups/GlobalBindGroup";
import { GPUContext } from "../../GPUContext";
import { EntityCollect } from "../../collect/EntityCollect";
import { GBufferFrame } from "../../frame/GBufferFrame";
import { RTFrame } from "../../frame/RTFrame";
import { OcclusionSystem } from "../../occlusion/OcclusionSystem";
import { RenderContext } from "../RenderContext";
import { RendererBase } from "../RendererBase";
import { ClusterLightingBuffer } from "../cluster/ClusterLightingBuffer";
import { PassType } from "../state/PassType";
import { RendererMask } from "../state/RendererMask";

/**
 *  @internal
 * Base Color Renderer
 * @author sirxu
 * @group Post
 */
export class GUIPassRenderer extends RendererBase {
    constructor() {
        super();
        this.passType = PassType.UI;
    }

    public compute(view: View3D, occlusionSystem: OcclusionSystem): void {
        let command = GPUContext.beginCommandEncoder();
        let src = GPUContext.lastRenderPassState.getLastRenderTexture();
        let dest = GBufferFrame.getGUIBufferFrame().getColorTexture();
        GPUContext.copyTexture(command, src, dest);
        GPUContext.endCommandEncoder(command);
    }

    public render(view: View3D, occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer, maskTr: boolean = false) {
        this.renderContext.clean();


        let scene = view.scene;
        let camera = view.camera;

        GlobalBindGroup.updateCameraGroup(camera);

        this.rendererPassState.camera3D = camera;

        let collectInfo = EntityCollect.instance.getRenderNodes(scene, camera);

        {
            this.renderContext.specialtRenderPass();

            let renderPassEncoder = this.renderContext.encoder;


            if (collectInfo.opaqueList) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                this.drawNodes(view, this.renderContext, collectInfo.opaqueList, occlusionSystem, clusterLightingBuffer);
            }
        }

        {

            let renderPassEncoder = this.renderContext.encoder;


            if (!maskTr && collectInfo.transparentList) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                this.drawNodes(view, this.renderContext, collectInfo.transparentList, occlusionSystem, clusterLightingBuffer);
            }
            this.renderContext.endRenderPass();
        }

    }

    public drawNodes(view: View3D, renderContext: RenderContext, nodes: RenderNode[], occlusionSystem: OcclusionSystem, clusterLightingBuffer: ClusterLightingBuffer) {
        let viewRenderList = EntityCollect.instance.getRenderShaderCollect(view);
        if (viewRenderList) {
            for (const renderList of viewRenderList) {
                let nodeMap = renderList[1];
                for (const iterator of nodeMap) {
                    let node = iterator[1];
                    if (!node.isDestroyed && node.preInit(this._rendererType)) {
                        node.nodeUpdate(view, this._rendererType, this.rendererPassState, clusterLightingBuffer);
                        break;
                    }
                }
            }

            for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
                let renderNode = nodes[i];
                if (!renderNode.transform.enable)
                    continue;
                if (!renderNode.enable)
                    continue;
                if (!renderNode.hasMask(RendererMask.UI) || renderNode.isRecievePostEffectUI)
                    continue;
                if (renderNode.isDestroyed)
                    continue;
                if (!renderNode.preInit(this._rendererType)) {
                    renderNode.nodeUpdate(view, this._rendererType, this.rendererPassState, clusterLightingBuffer);
                }
                renderNode.renderPass(view, this.passType, this.renderContext);
            }
        }
    }


    protected occlusionRenderNodeTest(i: number, id: number, occlusionSystem: OcclusionSystem): boolean {
        return occlusionSystem.zDepthRenderNodeTest(id) > 0;
    }
}
