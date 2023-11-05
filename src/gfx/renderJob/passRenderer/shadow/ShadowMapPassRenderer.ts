import { Engine3D } from "../../../../Engine3D";
import { DirectLight } from "../../../../components/lights/DirectLight";
import { RenderNode } from "../../../../components/renderer/RenderNode";
import { Camera3D } from "../../../../core/Camera3D";
import { View3D } from "../../../../core/View3D";
import { Vector3 } from "../../../../math/Vector3";
import { Depth2DTextureArray } from "../../../../textures/Depth2DTextureArray";
import { Time } from "../../../../util/Time";
import { GPUTextureFormat } from "../../../graphics/webGpu/WebGPUConst";
import { WebGPUDescriptorCreator } from "../../../graphics/webGpu/descriptor/WebGPUDescriptorCreator";
import { GPUContext } from "../../GPUContext";
import { EntityCollect } from "../../collect/EntityCollect";
import { ShadowLightsCollect } from "../../collect/ShadowLightsCollect";
import { RTFrame } from "../../frame/RTFrame";
import { OcclusionSystem } from "../../occlusion/OcclusionSystem";
import { RendererPassState } from "../state/RendererPassState";
import { PassType } from "../state/RendererType";
import { RendererBase } from "../RendererBase";
import { ClusterLightingBuffer } from "../cluster/ClusterLightingBuffer";
import { Reference } from "../../../../util/Reference";
import { Texture } from "../../../graphics/webGpu/core/texture/Texture";
import { CSM } from "../../../../core/csm/CSM";
import { VirtualTexture } from "../../../../textures/VirtualTexture";

/**
 * @internal
 * @group Post
 */
export class ShadowMapPassRenderer extends RendererBase {
    public shadowPassCount: number;
    public depth2DArrayTexture: Depth2DTextureArray;
    public rendererPassStates: RendererPassState[];
    private _forceUpdate = false;

    constructor() {
        super();
        this.setShadowMap(Engine3D.setting.shadow.shadowSize, CSM.Cascades);
        this.passType = PassType.SHADOW;
    }

    setShadowMap(size: number, cascades: number) {
        this.rendererPassStates = [];
        this.depth2DArrayTexture = new Depth2DTextureArray(size, size, GPUTextureFormat.depth32float, 8);
        Reference.getInstance().attached(this.depth2DArrayTexture, this);

        for (let i = 0; i < 8; i++) {
            let rtFrame = new RTFrame([], []);
            const tex = new VirtualTexture(size, size, GPUTextureFormat.depth32float, false);
            tex.name = `shadowDepthTexture_${i}`;
            rtFrame.depthTexture = tex;
            rtFrame.label = "shadowRender";
            rtFrame.customSize = true;
            rtFrame.depthCleanValue = 1;
            let rendererPassState = WebGPUDescriptorCreator.createRendererPassState(rtFrame);
            this.rendererPassStates[i] = rendererPassState;
        }
    }

    render(view: View3D, occlusionSystem: OcclusionSystem) {
        let shadowSetting = Engine3D.setting.shadow;
        if (!shadowSetting.enable)
            return;
        let camera = view.camera;
        let scene = view.scene;
        this.shadowPassCount = 0;
        if (!shadowSetting.needUpdate)
            return;
        if (!(Time.frame % shadowSetting.updateFrameRate == 0))
            return;

        //*********************/
        //***shadow light******/
        //*********************/

        let shadowLightList = ShadowLightsCollect.getDirectShadowLightWhichScene(scene);
        let shadowSize = shadowSetting.shadowSize;
        const cascades = CSM.Cascades;
        for (let light of shadowLightList) {
            const dirLight = light as DirectLight;
            let shadowIndex = dirLight.shadowIndex;
            this.rendererPassState = this.rendererPassStates[shadowIndex];

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

            if ((dirLight.castShadow && dirLight.needUpdateShadow || this._forceUpdate) || (dirLight.castShadow && shadowSetting.autoUpdate)) {
                dirLight.needUpdateShadow = false;
                if (camera.enableCSM && shadowIndex == 0) {
                    for (let csmIndex = 0; csmIndex < cascades; csmIndex++) {
                        this.rendererPassState = this.rendererPassStates[csmIndex];
                        let csmChild = camera.csm.children[csmIndex];
                        let extents = camera.getCSMShadowWorldExtents(csmIndex);
                        this.poseShadowCamera(camera, dirLight.direction, csmChild.shadowCamera, extents, csmChild.bound.center);
                        this.renderShadow(view, csmChild.shadowCamera, occlusionSystem, this.rendererPassState);
                        this.copyDepthTexture(this.rendererPassState.depthTexture, this.depth2DArrayTexture, csmIndex, shadowSize);
                    }
                } else {
                    if (camera.enableCSM) {
                        shadowIndex += cascades - 1;
                    }
                    let extents = camera.getShadowWorldExtents();
                    this.rendererPassState = this.rendererPassStates[shadowIndex];
                    this.poseShadowCamera(camera, dirLight.direction, dirLight.shadowCamera, extents, camera.lookTarget);
                    this.renderShadow(view, dirLight.shadowCamera, occlusionSystem, this.rendererPassState);
                    this.copyDepthTexture(this.rendererPassState.depthTexture, this.depth2DArrayTexture, shadowIndex, shadowSize);
                }
            }
        }

        this._forceUpdate = false;
    }

    private copyDepthTexture(src: Texture, dst: Texture, dstIndex: number, shadowSize: number) {
        let qCommand = GPUContext.beginCommandEncoder();
        qCommand.copyTextureToTexture(
            {
                texture: src.getGPUTexture(),
                mipLevel: 0,
                origin: { x: 0, y: 0, z: 0 },
            },
            {
                texture: dst.getGPUTexture(),
                mipLevel: 0,
                origin: { x: 0, y: 0, z: dstIndex },
            },
            {
                width: shadowSize,
                height: shadowSize,
                depthOrArrayLayers: 1,
            },
        );
        GPUContext.endCommandEncoder(qCommand);
    }

    private _shadowPos: Vector3 = new Vector3();
    private _shadowCameraTarget: Vector3 = new Vector3();

    private poseShadowCamera(viewCamera: Camera3D, direction: Vector3, shadowCamera: Camera3D, extents: number, lookAt: Vector3) {
        this._shadowPos.copy(direction).normalize(viewCamera.far);
        lookAt.add(this._shadowPos, this._shadowCameraTarget);
        lookAt.subtract(this._shadowPos, this._shadowPos);
        shadowCamera.transform.lookAt(this._shadowPos, this._shadowCameraTarget);
        shadowCamera.orthoOffCenter(-extents, extents, -extents, extents, viewCamera.near, viewCamera.far * 2);
    }

    public compute() {

    }

    private renderShadow(view: View3D, shadowCamera: Camera3D, occlusionSystem: OcclusionSystem, state: RendererPassState) {
        let collectInfo = EntityCollect.instance.getRenderNodes(view.scene, shadowCamera);
        let command = GPUContext.beginCommandEncoder();
        let encoder = GPUContext.beginRenderPass(command, state);

        shadowCamera.transform.updateWorldMatrix();
        // shadowCamera.transform.updateWorldMatrix();
        if (OcclusionSystem.enable) {
            occlusionSystem.update(shadowCamera, view.scene);
            occlusionSystem.collect(collectInfo, shadowCamera);
        }
        GPUContext.bindCamera(encoder, shadowCamera);
        let op_bundleList = this.renderShadowBundleOp(view, shadowCamera, state);
        let tr_bundleList = this.renderShadowBundleTr(view, shadowCamera, state);

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

    protected renderShadowBundleOp(view: View3D, shadowCamera: Camera3D, state: RendererPassState) {
        let entityBatchCollect = EntityCollect.instance.getOpRenderGroup(view.scene);
        if (entityBatchCollect) {
            let bundlerList = [];
            entityBatchCollect.renderGroup.forEach((v) => {
                if (v.bundleMap.has(this._rendererType)) {
                    bundlerList.push(v.bundleMap.get(this._rendererType));
                } else {
                    let renderBundleEncoder = GPUContext.recordBundleEncoder(state.renderBundleEncoderDescriptor);
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

    protected renderShadowBundleTr(view: View3D, shadowCamera: Camera3D, state: RendererPassState) {
        let entityBatchCollect = EntityCollect.instance.getTrRenderGroup(view.scene);
        if (entityBatchCollect) {
            let bundlerList = [];
            entityBatchCollect.renderGroup.forEach((v) => {
                if (v.bundleMap.has(this._rendererType)) {
                    bundlerList.push(v.bundleMap.get(this._rendererType));
                } else {
                    let renderBundleEncoder = GPUContext.recordBundleEncoder(state.renderBundleEncoderDescriptor);
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
        if (nodes) {
            GPUContext.bindGeometryBuffer(encoder, nodes[0].geometry);
            for (let i = 0; i < nodes.length; ++i) {
                let renderNode = nodes[i];
                if (!renderNode.transform.enable)
                    continue;
                renderNode.recordRenderPass2(view, this._rendererType, this.rendererPassState, clusterLightingBuffer, encoder);
            }
        }
    }

    protected drawShadowRenderNodes(view: View3D, shadowCamera: Camera3D, encoder: GPURenderPassEncoder, nodes: RenderNode[], clusterLightingBuffer?: ClusterLightingBuffer) {
        GPUContext.bindCamera(encoder, shadowCamera);
        if (nodes) {
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
}
