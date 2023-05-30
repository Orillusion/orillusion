import { Engine3D } from "../../../../Engine3D";
import { RenderNode } from "../../../../components/renderer/RenderNode";
import { View3D } from "../../../../core/View3D";
import { ProfilerUtil } from "../../../../util/ProfilerUtil";
import { GPUContext } from "../../GPUContext";
import { EntityCollect } from "../../collect/EntityCollect";
import { OcclusionSystem } from "../../occlusion/OcclusionSystem";
import { RenderContext } from "../RenderContext";
import { RendererBase } from "../RendererBase";
import { ClusterLightingBuffer } from "../cluster/ClusterLightingBuffer";
import { RendererType } from "../state/RendererType";


/**
 *  @internal
 * Base Color Renderer
 * @author sirxu
 * @group Post
 */
export class ColorPassRenderer extends RendererBase {
    constructor() {
        super();
        this.passType = RendererType.COLOR;
    }

    public render(view: View3D, occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer, maskTr: boolean = false) {
        this.renderContext.clean();

        let scene = view.scene;
        let camera = view.camera;

        this.rendererPassState.camera3D = camera;
        let collectInfo = EntityCollect.instance.getRenderNodes(scene);

        let op_bundleList = this.renderBundleOp(view, collectInfo, occlusionSystem, clusterLightingBuffer);
        let tr_bundleList = maskTr ? [] : this.renderBundleTr(view, collectInfo, occlusionSystem, clusterLightingBuffer);

        ProfilerUtil.start("colorPass Renderer");
        {
            ProfilerUtil.start("ColorPass Draw Opaque");

            this.renderContext.beginRenderPass();

            let command = this.renderContext.command;
            let renderPassEncoder = this.renderContext.encoder;

            // renderPassEncoder.setViewport(camera.viewPort.x, camera.viewPort.y, camera.viewPort.width, camera.viewPort.height, 0.0, 1.0);
            // renderPassEncoder.setScissorRect(camera.viewPort.x, camera.viewPort.y, camera.viewPort.width, camera.viewPort.height);

            // renderPassEncoder.setViewport(view.viewPort.x, view.viewPort.y, view.viewPort.width, view.viewPort.height, 0.0, 1.0);
            // renderPassEncoder.setScissorRect(view.viewPort.x, view.viewPort.y, view.viewPort.width, view.viewPort.height);

            GPUContext.bindCamera(renderPassEncoder, camera);

            if (op_bundleList.length > 0) {
                //  GPUContext.bindCamera(renderPassEncoder,camera);
                let entityBatchCollect = EntityCollect.instance.getOpRenderGroup(scene);
                entityBatchCollect.renderGroup.forEach((group) => {
                    for (let i = 0; i < group.renderNodes.length; i++) {
                        const node = group.renderNodes[i];
                        node.transform.updateWorldMatrix();
                    }
                });

                renderPassEncoder.executeBundles(op_bundleList);
            }

            if (!maskTr && EntityCollect.instance.sky) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                EntityCollect.instance.sky.renderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, renderPassEncoder);
            }

            GPUContext.bindCamera(renderPassEncoder, camera);
            this.drawNodes(view, this.renderContext, collectInfo.opaqueList, occlusionSystem, clusterLightingBuffer);
            this.renderContext.endRenderPass();
            ProfilerUtil.end("ColorPass Draw Opaque");
        }

        {
            ProfilerUtil.start("ColorPass Draw Transparent");

            this.renderContext.beginRenderPass();

            let command = this.renderContext.command;
            let renderPassEncoder = this.renderContext.encoder;

            if (tr_bundleList.length > 0) {
                renderPassEncoder.executeBundles(tr_bundleList);
            }

            if (!maskTr) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                this.drawNodes(view, this.renderContext, collectInfo.transparentList, occlusionSystem, clusterLightingBuffer);
            }

            let graphicsList = EntityCollect.instance.getGraphicList();
            for (let i = 0; i < graphicsList.length; i++) {
                const graphic3DRenderNode = graphicsList[i];
                let matrixIndex = graphic3DRenderNode.transform.worldMatrix.index;
                graphic3DRenderNode.nodeUpdate(view, this._rendererType, this.splitRendererPassState, clusterLightingBuffer);
                graphic3DRenderNode.renderPass2(view, this._rendererType, this.splitRendererPassState, clusterLightingBuffer, renderPassEncoder);
            }

            this.renderContext.endRenderPass();
            ProfilerUtil.end("ColorPass Draw Transparent");
        }

        ProfilerUtil.end("colorPass Renderer");
    }

    public drawNodes(view: View3D, renderContext: RenderContext, nodes: RenderNode[], occlusionSystem: OcclusionSystem, clusterLightingBuffer: ClusterLightingBuffer) {
        {
            for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
                let renderNode = nodes[i];
                if (!occlusionSystem.renderCommitTesting(view.camera, renderNode))
                    continue;
                if (!renderNode.transform.enable)
                    continue;
                if (!renderNode.enable)
                    continue;

                renderNode.nodeUpdate(view, this._rendererType, this.rendererPassState, clusterLightingBuffer);
                renderNode.renderPass(view, this.passType, this.renderContext);
            }
        }
    }


    protected occlusionRenderNodeTest(i: number, id: number, occlusionSystem: OcclusionSystem): boolean {
        return occlusionSystem.zDepthRenderNodeTest(id) > 0;
    }
}
