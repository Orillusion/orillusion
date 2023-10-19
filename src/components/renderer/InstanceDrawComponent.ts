import { GPUContext } from "../../gfx/renderJob/GPUContext";
import { RTResourceMap } from "../../gfx/renderJob/frame/RTResourceMap";
import { ClusterLightingRender } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingRender";
import { RenderContext } from "../../gfx/renderJob/passRenderer/RenderContext";
import { MeshRenderer } from "./MeshRenderer";
import { RenderNode } from "./RenderNode";
import { StorageGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer";
import { View3D } from "../../core/View3D";
import { RendererPassState } from "../../gfx/renderJob/passRenderer/state/RendererPassState";
import { PassType } from "../../gfx/renderJob/passRenderer/state/RendererType";
import { ClusterLightingBuffer } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";

export class InstanceDrawComponent extends RenderNode {

    private _keyRenderGroup: Map<string, MeshRenderer[]>;
    private _keyBufferGroup: Map<string, StorageGPUBuffer>;
    private _keyIdsGroup: Map<string, number[]>;
    public init(param?: any): void {
        this._keyRenderGroup = new Map<string, MeshRenderer[]>();
        this._keyBufferGroup = new Map<string, StorageGPUBuffer>();
        this._keyIdsGroup = new Map<string, number[]>();
    }

    public start(): void {

        let meshRenders: MeshRenderer[] = [];
        this.object3D.getComponents(MeshRenderer, meshRenders, true);

        // let idArray = new Int32Array(meshRenders.length);
        for (let i = 0; i < meshRenders.length; i++) {
            const mr = meshRenders[i];
            mr.transform.updateWorldMatrix(true);
            mr.enable = false;


            let key = mr.geometry.instanceID;
            for (let j = 0; j < mr.materials.length; j++) {
                const mat = mr.materials[j];
                key += mat.instanceID;
            }

            if (!this._keyRenderGroup.has(key)) {
                let matrixBuffer = new StorageGPUBuffer(meshRenders.length);
                matrixBuffer.visibility = GPUShaderStage.VERTEX;
                this._keyRenderGroup.set(key, [mr]);
                this._keyBufferGroup.set(key, matrixBuffer);
                this._keyIdsGroup.set(key, [mr.transform.worldMatrix.index]);
            } else {
                this._keyRenderGroup.get(key).push(mr);
                this._keyIdsGroup.get(key).push(mr.transform.worldMatrix.index);
            }
        }

        this._keyBufferGroup.forEach((v, k) => {
            let ids = this._keyIdsGroup.get(k);
            let instanceMatrixBuffer = this._keyBufferGroup.get(k);
            instanceMatrixBuffer.setInt32Array("matrixIDs", new Int32Array(ids));
            instanceMatrixBuffer.apply();
        })
    }

    public stop(): void {

    }

    public nodeUpdate(view: View3D, passType: PassType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer): void {
        this._keyRenderGroup.forEach((v, k) => {
            let instanceMatrixBuffer = this._keyBufferGroup.get(k);
            let renderNode = v[0];
            for (let i = 0; i < renderNode.materials.length; i++) {
                let material = renderNode.materials[i];
                let passes = material.getPass(passType);
                if (passes) {
                    for (let i = 0; i < passes.length; i++) {
                        const renderShader = passes[i];
                        renderShader.setDefine("USE_INSTANCEDRAW", true);
                        renderShader.setStorageBuffer(`instanceDrawID`, instanceMatrixBuffer);
                    }
                }
            }
            renderNode.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
        })
        this.preInit = false;
    }


    public renderPass(view: View3D, passType: PassType, renderContext: RenderContext) {
        this._keyRenderGroup.forEach((v, k) => {
            let renderNode = v[0];
            renderNode.instanceCount = v.length;
            this.renderItem(view, passType, renderNode, renderContext);
        })
    }

    public renderItem(view: View3D, passType: PassType, renderNode: RenderNode, renderContext: RenderContext) {
        let worldMatrix = renderNode.transform._worldMatrix;

        for (let i = 0; i < renderNode.materials.length; i++) {
            const material = renderNode.materials[i];
            let passes = material.getPass(passType);

            if (!passes || passes.length == 0)
                continue;

            for (let j = 0; j < passes.length; j++) {
                if (!passes || passes.length == 0)
                    continue;
                let matPass = passes[j];
                // if (!matPass.enable)
                //     continue;

                GPUContext.bindGeometryBuffer(renderContext.encoder, renderNode.geometry);
                const renderShader = matPass;
                if (renderShader.shaderState.splitTexture) {
                    renderContext.endRenderPass();
                    RTResourceMap.WriteSplitColorTexture(renderNode.instanceID);
                    renderContext.beginOpaqueRenderPass();

                    GPUContext.bindCamera(renderContext.encoder, view.camera);
                    GPUContext.bindGeometryBuffer(renderContext.encoder, renderNode.geometry);
                }
                GPUContext.bindPipeline(renderContext.encoder, renderShader);
                let subGeometries = renderNode.geometry.subGeometries;

                const subGeometry = subGeometries[i];
                let lodInfos = subGeometry.lodLevels;
                let lodInfo = lodInfos[renderNode.lodLevel];

                if (renderNode.instanceCount > 0) {
                    GPUContext.drawIndexed(renderContext.encoder, lodInfo.indexCount, renderNode.instanceCount, lodInfo.indexStart, 0, 0);
                } else {
                    GPUContext.drawIndexed(renderContext.encoder, lodInfo.indexCount, 1, lodInfo.indexStart, 0, worldMatrix.index);
                }
            }
        }
    }
}
