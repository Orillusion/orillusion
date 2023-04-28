import { Engine3D } from "../../../../Engine3D";
import { DirectLight } from "../../../../components/lights/DirectLight";
import { LightType } from "../../../../components/lights/LightData";
import { RenderNode } from "../../../../components/renderer/RenderNode";
import { Camera3D } from "../../../../core/Camera3D";
import { View3D } from "../../../../core/View3D";
import { clamp } from "../../../../math/MathUtil";
import { Vector3 } from "../../../../math/Vector3";
import { Depth2DTextureArray } from "../../../../textures/Depth2DTextureArray";
import { VirtualTexture } from "../../../../textures/VirtualTexture";
import { Time } from "../../../../util/Time";
import { GPUTextureFormat } from "../../../graphics/webGpu/WebGPUConst";
import { WebGPUDescriptorCreator } from "../../../graphics/webGpu/descriptor/WebGPUDescriptorCreator";
import { GPUContext } from "../../GPUContext";
import { EntityCollect } from "../../collect/EntityCollect";
import { ShadowLightsCollect } from "../../collect/ShadowLightsCollect";
import { RTFrame } from "../../frame/RTFrame";
import { OcclusionSystem } from "../../occlusion/OcclusionSystem";
import { RendererPassState } from "../state/RendererPassState";
import { RendererType } from "../state/RendererType";
import { RendererBase } from "../RendererBase";
import { ClusterLightingBuffer } from "../cluster/ClusterLightingBuffer";

/**
 * @internal
 * @group Post
 */
export class ShadowMapPassRenderer extends RendererBase {
    // public shadowCamera: Camera3D;
    public shadowPassCount: number;
    public depth2DTextureArray: Depth2DTextureArray;
    public rendererPassStates: RendererPassState[];
    private _forceUpdate = false;
    constructor() {
        super();
        this.passType = RendererType.SHADOW;
        this.setShadowMap(Engine3D.setting.shadow.shadowSize);
        if (Engine3D.setting.shadow.debug) {
            this.debug();
        }
    }

    debug() {
    }

    setShadowMap(size: number) {
        this.rendererPassStates = [];
        this.depth2DTextureArray = new Depth2DTextureArray(size, size);

        for (let i = 0; i < 8; i++) {
            let rtFrame = new RTFrame([], []);
            const tex = new VirtualTexture(size, size, GPUTextureFormat.depth32float, false);
            tex.name = `shadowDepthTexture_${i}`;
            rtFrame.depthTexture = tex;
            rtFrame.label = "shadowRender"
            rtFrame.customSize = true;
            rtFrame.depthCleanValue = 1;
            let rendererPassState = WebGPUDescriptorCreator.createRendererPassState(rtFrame);
            this.rendererPassStates[i] = rendererPassState;
        }

    }


    render(view: View3D, occlusionSystem: OcclusionSystem) {
        // return ;
        if (!Engine3D.setting.shadow.enable)
            return;

        let camera = view.camera;
        let scene = view.scene;

        // return ;
        this.shadowPassCount = 0;

        // return ;
        if (!Engine3D.setting.shadow.needUpdate)
            return;
        if (!(Time.frame % Engine3D.setting.shadow.updateFrameRate == 0))
            return;
        // return ;//
        camera.transform.updateWorldMatrix();
        //*********************/
        //***shadow light******/
        //*********************/
        let shadowLight = ShadowLightsCollect.getDirectShadowLightWhichScene(scene);
        let li = 0;
        for (let si = 0; si < shadowLight.length; si++) {
            const light = shadowLight[si] as DirectLight;
            if (light.lightData.lightType != LightType.DirectionLight)
                continue;

            this.rendererPassState = this.rendererPassStates[light.shadowIndex];
            if ((light.castShadow && light.needUpdateShadow || this._forceUpdate) || (light.castShadow && Engine3D.setting.shadow.autoUpdate)) {
                light.needUpdateShadow = false;
                let shadowFar = clamp(Engine3D.setting.shadow.shadowFar, camera.near, camera.far);

                let shadowPos = Vector3.HELP_4;
                let shadowLookTarget = Vector3.HELP_5;
                shadowLookTarget.copy(camera.lookTarget);
                shadowPos.copy(light.direction);
                shadowPos.normalize();
                let dis = Vector3.distance(camera.transform.worldPosition, shadowLookTarget);
                shadowPos.scaleBy(-shadowFar);
                shadowPos.add(shadowLookTarget, shadowPos);
                light.shadowCamera.transform.lookAt(shadowPos, shadowLookTarget);
                let w = Engine3D.setting.shadow.shadowBound;
                let h = Engine3D.setting.shadow.shadowBound;
                light.shadowCamera.orthoOffCenter(w / -2, w / 2, h / -2, h / 2, camera.near, camera.far);
                this.renderShadow(view, light.shadowCamera, occlusionSystem);
                li++;
            }

            let qCommand = GPUContext.beginCommandEncoder();
            qCommand.copyTextureToTexture(
                {
                    texture: this.rendererPassStates[light.shadowIndex].depthTexture.getGPUTexture(),
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z: 0 },
                },
                {
                    texture: this.depth2DTextureArray.getGPUTexture(),
                    mipLevel: 0,
                    origin: { x: 0, y: 0, z: light.shadowIndex },
                },
                {
                    width: Engine3D.setting.shadow.shadowSize,
                    height: Engine3D.setting.shadow.shadowSize,
                    depthOrArrayLayers: 1,
                },
            );
            GPUContext.endCommandEncoder(qCommand);
        }

        this._forceUpdate = false;
    }

    public beforeCompute() {

    }

    private renderShadow(view: View3D, shadowCamera: Camera3D, occlusionSystem: OcclusionSystem) {
        let collectInfo = EntityCollect.instance.getRenderNodes(view.scene);
        let command = GPUContext.beginCommandEncoder();
        let encoder = GPUContext.beginRenderPass(command, this.rendererPassState);

        shadowCamera.transform.updateWorldMatrix();
        occlusionSystem.update(shadowCamera, view.scene);
        GPUContext.bindCamera(encoder, shadowCamera);
        let op_bundleList = this.renderShadowBundleOp(view, shadowCamera);
        let tr_bundleList = this.renderShadowBundleTr(view, shadowCamera);

        if (op_bundleList.length > 0) {
            encoder.executeBundles(op_bundleList);
        }
        this.drawShadowRenderNodes(view, shadowCamera, encoder, collectInfo.opaqueList);
        if (tr_bundleList.length > 0) {
            encoder.executeBundles(tr_bundleList);
        }

        this.drawShadowRenderNodes(view, shadowCamera, encoder, collectInfo.transparentList);
        GPUContext.endPass(encoder);
        GPUContext.endCommandEncoder(command);
    }

    protected renderShadowBundleOp(view: View3D, shadowCamera: Camera3D) {
        let entityBatchCollect = EntityCollect.instance.getOpRenderGroup(view.scene);
        if (entityBatchCollect) {
            let bundlerList = [];
            entityBatchCollect.renderGroup.forEach((v) => {
                if (v.bundleMap.has(this._rendererType)) {
                    bundlerList.push(v.bundleMap.get(this._rendererType));
                } else {
                    let renderBundleEncoder = GPUContext.recordBundleEncoder(this.rendererPassState.renderBundleEncoderDescriptor);
                    this.recordShadowRenderBundleNode(view, shadowCamera, renderBundleEncoder, v.renderNodes);
                    let newBundle = renderBundleEncoder.finish();
                    v.bundleMap.set(this._rendererType, newBundle);
                    bundlerList.push(newBundle);
                }
            });
            return bundlerList;
        }
        return [];
    }

    protected renderShadowBundleTr(view: View3D, shadowCamera: Camera3D) {
        let entityBatchCollect = EntityCollect.instance.getTrRenderGroup(view.scene);
        if (entityBatchCollect) {
            let bundlerList = [];
            entityBatchCollect.renderGroup.forEach((v) => {
                if (v.bundleMap.has(this._rendererType)) {
                    bundlerList.push(v.bundleMap.get(this._rendererType));
                } else {
                    let renderBundleEncoder = GPUContext.recordBundleEncoder(this.rendererPassState.renderBundleEncoderDescriptor);
                    this.recordShadowRenderBundleNode(view, shadowCamera, renderBundleEncoder, v.renderNodes);
                    let newBundle = renderBundleEncoder.finish();
                    v.bundleMap.set(this._rendererType, newBundle);
                    bundlerList.push(newBundle);
                }
            });
            return bundlerList;
        }
        return [];
    }


    protected recordShadowRenderBundleNode(view: View3D, shadowCamera: Camera3D, encoder, nodes: RenderNode[], clusterLightingBuffer?: ClusterLightingBuffer) {
        GPUContext.bindCamera(encoder, shadowCamera);
        GPUContext.bindGeometryBuffer(encoder, nodes[0].geometry);
        for (let i = 0; i < nodes.length; ++i) {
            let renderNode = nodes[i];
            let matrixIndex = renderNode.transform.worldMatrix.index;
            if (!renderNode.transform.enable)
                continue;
            renderNode.recordRenderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, encoder);
        }
    }

    protected drawShadowRenderNodes(view: View3D, shadowCamera: Camera3D, encoder: GPURenderPassEncoder, nodes: RenderNode[], clusterLightingBuffer?: ClusterLightingBuffer) {
        GPUContext.bindCamera(encoder, shadowCamera);
        for (let i = Engine3D.setting.render.drawOpMin; i < Math.min(nodes.length, Engine3D.setting.render.drawOpMax); ++i) {
            let renderNode = nodes[i];
            // let matrixIndex = renderNode.transform.worldMatrix.index;
            // if (!occlusionSystem.renderCommitTesting(camera,renderNode) ) continue;
            if (!renderNode.transform.enable)
                continue;
            if (!renderNode.enable)
                continue;
            renderNode.renderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, encoder);
        }
    }
}
