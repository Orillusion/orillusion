import { Engine3D } from "../../../../Engine3D";
import { RenderNode } from "../../../../components/renderer/RenderNode";
import { View3D } from "../../../../core/View3D";
import { VirtualTexture } from "../../../../textures/VirtualTexture";
import { ProfilerUtil } from "../../../../util/ProfilerUtil";
import { webGPUContext } from "../../../graphics/webGpu/Context3D";
import { GPUTextureFormat } from "../../../graphics/webGpu/WebGPUConst";
import { RTDescriptor } from "../../../graphics/webGpu/descriptor/RTDescriptor";
import { GPUContext } from "../../GPUContext";
import { EntityCollect } from "../../collect/EntityCollect";
import { RTResourceConfig } from "../../config/RTResourceConfig";
import { RTFrame } from "../../frame/RTFrame";
import { RTResourceMap } from "../../frame/RTResourceMap";
import { OcclusionSystem } from "../../occlusion/OcclusionSystem";
import { RendererBase } from "../RendererBase";
import { ClusterLightingBuffer } from "../cluster/ClusterLightingBuffer";
import { PassType } from "../state/RendererType";
import { ZCullingCompute } from "./ZCullingCompute";

/**
 * @internal
 * @group Post
 */
export class PreDepthPassRenderer extends RendererBase {
    public zBufferTexture: VirtualTexture;
    public useRenderBundle: boolean = false;
    shadowPassCount: number;
    zCullingCompute: ZCullingCompute;
    constructor() {
        super();
        this.passType = PassType.DEPTH;

        let size = webGPUContext.presentationSize;
        let scale = 1;
        this.zBufferTexture = RTResourceMap.createRTTexture(RTResourceConfig.zBufferTexture_NAME, Math.floor(size[0] * scale), Math.floor(size[1] * scale), GPUTextureFormat.rgba16float, false);
        let rtDec = new RTDescriptor()
        rtDec.clearValue = [0, 0, 0, 0];
        rtDec.loadOp = `clear`;
        let rtFrame = new RTFrame([
        ], [
            // new RTDescriptor()
        ],
            RTResourceMap.createRTTexture(RTResourceConfig.zPreDepthTexture_NAME, Math.floor(size[0]), Math.floor(size[1]), GPUTextureFormat.depth32float, false),
            null,
            false
        );
        this.setRenderStates(rtFrame);
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        let camera = view.camera;
        let scene = view.scene;
        GPUContext.cleanCache();

        ProfilerUtil.start("DepthPass Renderer");

        let scene3D = scene;

        this.rendererPassState.camera3D = camera;
        let collectInfo = EntityCollect.instance.getRenderNodes(scene3D, camera);
        this.compute(view, occlusionSystem);

        let op_bundleList = this.renderBundleOp(view, collectInfo, occlusionSystem);
        let tr_bundleList = true ? [] : this.renderBundleTr(view, collectInfo, occlusionSystem);

        let command = GPUContext.beginCommandEncoder();
        let encoder = GPUContext.beginRenderPass(command, this.rendererPassState);

        if (op_bundleList.length > 0) {
            encoder.executeBundles(op_bundleList);
        }

        // if (!true && EntityCollect.instance.sky) {
        //     GPUContext.bindCamera(encoder, camera);
        //     EntityCollect.instance.sky.renderPass2(this._rendererType, this.rendererPassState, scene, this.clusterLightingRender, encoder);
        // }
        let viewRenderList = EntityCollect.instance.getRenderShaderCollect(view);
        for (const renderList of viewRenderList) {
            let nodeMap = renderList[1];
            for (const iterator of nodeMap) {
                let node = iterator[1];
                if (node.preInit) {
                    node.nodeUpdate(view, this._rendererType, this.rendererPassState, null);
                    break;
                }
            }
        }

        this.drawRenderNodes(view, encoder, command, collectInfo.opaqueList, occlusionSystem);

        if (tr_bundleList.length > 0) {
            encoder.executeBundles(tr_bundleList);
        }


        GPUContext.endPass(encoder);
        GPUContext.endCommandEncoder(command);

        ProfilerUtil.end("DepthPass Renderer");
        // ProfilerUtil.print( "DepthPass Renderer" );
    }

    protected drawRenderNodes(view: View3D, encoder: GPURenderPassEncoder, command: GPUCommandEncoder, nodes: RenderNode[], occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer) {
        GPUContext.bindCamera(encoder, view.camera);
        for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
            let renderNode = nodes[i];
            // if (!occlusionSystem.renderCommitTesting(view.camera, renderNode))
            //     continue;
            if (!renderNode.transform.enable)
                continue;
            if (!renderNode.enable)
                continue;
            if (!renderNode.preInit) {
                renderNode.nodeUpdate(view, this._rendererType, this.rendererPassState);
            }
            renderNode.renderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, encoder);
        }
    }

}
