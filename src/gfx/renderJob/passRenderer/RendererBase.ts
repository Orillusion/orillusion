import { Engine3D } from "../../../Engine3D";
import { RenderNode } from "../../../components/renderer/RenderNode";
import { Scene3D } from "../../../core/Scene3D";
import { View3D } from "../../../core/View3D";
import { ViewQuad } from "../../../core/ViewQuad";
import { CEventDispatcher } from "../../../event/CEventDispatcher";
import { VirtualTexture } from "../../../textures/VirtualTexture";
import { GPUTextureFormat } from "../../graphics/webGpu/WebGPUConst";
import { Texture } from "../../graphics/webGpu/core/texture/Texture";
import { WebGPUDescriptorCreator } from "../../graphics/webGpu/descriptor/WebGPUDescriptorCreator";
import { GPUContext } from "../GPUContext";
import { CollectInfo } from "../collect/CollectInfo";
import { EntityCollect } from "../collect/EntityCollect";
import { RTFrame } from "../frame/RTFrame";
import { OcclusionSystem } from "../occlusion/OcclusionSystem";
import { RendererPassState } from "./state/RendererPassState";
import { RendererType } from "./state/RendererType";
import { RenderContext } from "./RenderContext";
import { ClusterLightingRender } from "./cluster/ClusterLightingRender";
import { ClusterLightingBuffer } from "./cluster/ClusterLightingBuffer";


/**
 * @internal
 * @group Post
 */
export class RendererBase extends CEventDispatcher {
    public rendererPassState: RendererPassState;
    public splitRendererPassState: RendererPassState;
    public useRenderBundle: boolean = false;
    public debugViewQuads: ViewQuad[];
    public debugTextures: Texture[];

    protected renderContext: RenderContext;

    protected _rendererType: RendererType;
    protected _rtFrame: RTFrame;

    public get passType(): RendererType {
        return this._rendererType;
    }

    public set passType(value: RendererType) {
        this._rendererType = value;
    }

    constructor() {
        super();
        this.debugTextures = [];
        this.debugViewQuads = [];
    }

    public setRenderStates(rtFrame: RTFrame) {
        this._rtFrame = rtFrame;
        if (rtFrame) {
            this.rendererPassState = WebGPUDescriptorCreator.createRendererPassState(rtFrame);
            let splitRtFrame = rtFrame.clone();
            splitRtFrame.depthLoadOp = "load";
            for (const iterator of splitRtFrame.rtDescriptors) {
                iterator.loadOp = `load`;
            }
            this.splitRendererPassState = WebGPUDescriptorCreator.createRendererPassState(splitRtFrame);
        }

        this.renderContext = new RenderContext(rtFrame);
    }

    public setIrradiance(probeIrradianceMap: VirtualTexture, probeDepthMap: VirtualTexture) {
        this.rendererPassState.irradianceBuffer = [probeIrradianceMap, probeDepthMap];
    }



    public beforeCompute(view: View3D, occlusionSystem: OcclusionSystem) { }
    public lateCompute(view: View3D, occlusionSystem: OcclusionSystem) { }

    public render(view: View3D, occlusionSystem: OcclusionSystem, clusterLightingBuffer: ClusterLightingBuffer, maskTr: boolean = false) {
        GPUContext.cleanCache();

        let camera = view.camera;
        let scene = view.scene;

        this.rendererPassState.camera3D = camera;
        let collectInfo = EntityCollect.instance.getRenderNodes(scene);
        // this.compute(collectInfo, scene, occlusionSystem);

        let op_bundleList = this.renderBundleOp(view, collectInfo, occlusionSystem);
        let tr_bundleList = maskTr ? [] : this.renderBundleTr(view, collectInfo, occlusionSystem);

        {
            let command = GPUContext.beginCommandEncoder();
            let renderPassEncoder = GPUContext.beginRenderPass(command, this.rendererPassState);

            if (op_bundleList.length > 0) {
                renderPassEncoder.executeBundles(op_bundleList);
            }

            if (!maskTr && EntityCollect.instance.sky) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                EntityCollect.instance.sky.renderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, renderPassEncoder);
            }

            this.drawRenderNodes(view, renderPassEncoder, command, collectInfo.opaqueList, occlusionSystem);

            GPUContext.endPass(renderPassEncoder);
            GPUContext.endCommandEncoder(command);
        }

        {
            let command = GPUContext.beginCommandEncoder();
            let renderPassEncoder = GPUContext.beginRenderPass(command, this.rendererPassState);

            if (tr_bundleList.length > 0) {
                renderPassEncoder.executeBundles(tr_bundleList);
            }

            if (!maskTr) {
                GPUContext.bindCamera(renderPassEncoder, camera);
                this.drawRenderNodes(view, renderPassEncoder, command, collectInfo.transparentList, occlusionSystem);
            }

            GPUContext.endPass(renderPassEncoder);
            GPUContext.endCommandEncoder(command);
        }
    }

    protected nodeUpload(collectInfo: CollectInfo, scene: Scene3D, occlusionSystem?: OcclusionSystem) { }

    protected occlusionRenderNodeTest(i: number, id: number, occlusionSystem: OcclusionSystem): boolean {
        return occlusionSystem ? occlusionSystem.occlusionRenderNodeTest(i) > 0 : true;
    }

    protected renderOp(encoder: GPURenderPassEncoder, command: GPUCommandEncoder, collectInfo: CollectInfo, scene: Scene3D, occlusionSystem: OcclusionSystem) { }

    protected renderTr(encoder: GPURenderPassEncoder, command: GPUCommandEncoder, collectInfo: CollectInfo, scene: Scene3D, occlusionSystem: OcclusionSystem) { }

    protected renderBundleOp(view: View3D, collectInfo: CollectInfo, occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer) {
        let entityBatchCollect = EntityCollect.instance.getOpRenderGroup(view.scene);
        if (entityBatchCollect) {
            let bundlerList = [];
            entityBatchCollect.renderGroup.forEach((v) => {
                if (v.bundleMap.has(this._rendererType)) {
                    bundlerList.push(v.bundleMap.get(this._rendererType));
                } else {
                    let renderBundleEncoder = GPUContext.recordBundleEncoder(this.rendererPassState.renderBundleEncoderDescriptor);
                    this.recordRenderBundleNode(view, renderBundleEncoder, v.renderNodes, clusterLightingBuffer);
                    let newBundle = renderBundleEncoder.finish();
                    v.bundleMap.set(this._rendererType, newBundle);
                    bundlerList.push(newBundle);
                }
            });
            return bundlerList;
        }
        return [];
    }

    protected renderBundleTr(view: View3D, collectInfo: CollectInfo, occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer) {
        let entityBatchCollect = EntityCollect.instance.getTrRenderGroup(view.scene);
        if (entityBatchCollect) {
            let bundlerList = [];
            entityBatchCollect.renderGroup.forEach((v) => {
                if (v.bundleMap.has(this._rendererType)) {
                    bundlerList.push(v.bundleMap.get(this._rendererType));
                } else {
                    let renderBundleEncoder = GPUContext.recordBundleEncoder(this.rendererPassState.renderBundleEncoderDescriptor);
                    this.recordRenderBundleNode(view, renderBundleEncoder, v.renderNodes, clusterLightingBuffer);
                    let newBundle = renderBundleEncoder.finish();
                    v.bundleMap.set(this._rendererType, newBundle);
                    bundlerList.push(newBundle);
                }
            });
            return bundlerList;
        }
        return [];
    }

    protected recordRenderBundleNode(view: View3D, encoder, nodes: RenderNode[], clusterLightingBuffer?: ClusterLightingBuffer) {
        GPUContext.bindCamera(encoder, view.camera);
        GPUContext.bindGeometryBuffer(encoder, nodes[0].geometry);
        for (let i = 0; i < nodes.length; ++i) {
            let renderNode = nodes[i];
            let matrixIndex = renderNode.transform.worldMatrix.index;
            if (!renderNode.transform.enable)
                continue;
            renderNode.recordRenderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, encoder);
        }
    }

    protected drawRenderNodes(view: View3D, encoder: GPURenderPassEncoder, command: GPUCommandEncoder, nodes: RenderNode[], occlusionSystem: OcclusionSystem, clusterLightingBuffer?: ClusterLightingBuffer) {
        GPUContext.bindCamera(encoder, view.camera);
        for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
            let renderNode = nodes[i];
            if (!occlusionSystem.renderCommitTesting(view.camera, renderNode))
                continue;
            if (!renderNode.transform.enable)
                continue;
            if (!renderNode.enable)
                continue;
            renderNode.renderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, encoder);
        }
    }

    public setDebugTexture(textures: Texture[]) {
        for (let i = 0; i < textures.length; i++) {
            let tex = textures[i];
            let vs = "Quad_vert_wgsl";
            let fs = "Quad_frag_wgsl";
            switch (tex.format) {
                case GPUTextureFormat.rgba8sint:
                case GPUTextureFormat.rgba8uint:
                case GPUTextureFormat.rgba8unorm:
                case GPUTextureFormat.rgba16float:
                case GPUTextureFormat.rgba32float:
                    fs = `Quad_frag_wgsl`;
                    break;

                case GPUTextureFormat.depth24plus:
                case GPUTextureFormat.depth32float:
                    fs = `Quad_depth2d_frag_wgsl`;
                    if (tex.textureBindingLayout.viewDimension == `cube`) {
                        fs = `Quad_depthCube_frag_wgsl`;
                    }
                    break;
            }
            let viewQuad = new ViewQuad(vs, fs, new RTFrame([], []));
            this.debugTextures.push(textures[i]);
            this.debugViewQuads.push(viewQuad);
        }
    }
}
