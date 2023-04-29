import { GPUContext } from "../../gfx/renderJob/GPUContext";
import { RTResourceMap } from "../../gfx/renderJob/frame/RTResourceMap";
import { ClusterLightingRender } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingRender";
import { RenderContext } from "../../gfx/renderJob/passRenderer/RenderContext";
import { MeshRenderer } from "./MeshRenderer";
import { RenderNode } from "./RenderNode";
import { StorageGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer";
import { View3D } from "../../core/View3D";
import { RendererPassState } from "../../gfx/renderJob/passRenderer/state/RendererPassState";
import { RendererType } from "../../gfx/renderJob/passRenderer/state/RendererType";
import { ClusterLightingBuffer } from "../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer";

export class InstanceDrawComponent extends RenderNode {

    private _keyGroup: Map<string, MeshRenderer[]>;
    private _instanceMatrixBuffer: StorageGPUBuffer;
    public init(param?: any): void {
        this._keyGroup = new Map<string, MeshRenderer[]>();
    }

    public start(): void {

        let meshRenders: MeshRenderer[] = [];
        this.object3D.getComponents(MeshRenderer, meshRenders, true);
        this._instanceMatrixBuffer = new StorageGPUBuffer(meshRenders.length);
        this._instanceMatrixBuffer.visibility = GPUShaderStage.VERTEX;
        let idArray = new Int32Array(meshRenders.length);
        for (let i = 0; i < meshRenders.length; i++) {
            const mr = meshRenders[i];
            mr.transform.enable = false;

            idArray[i] = mr.transform.worldMatrix.index;
            let key = mr.geometry.uuid;
            for (let j = 0; j < mr.materials.length; j++) {
                const mat = mr.materials[j];
                key += mat.instanceID;
            }

            if (!this._keyGroup.has(key)) {
                this._keyGroup.set(key, [mr]);
            } else {
                this._keyGroup.get(key).push(mr);
            }
        }

        this.instanceCount = meshRenders.length;
        this._instanceMatrixBuffer.setInt32Array("matrixIDs", idArray);
        this._instanceMatrixBuffer.apply();
    }

    public stop(): void {

    }

    public nodeUpdate(view: View3D, passType: RendererType, renderPassState: RendererPassState, clusterLightingBuffer?: ClusterLightingBuffer): void {


        this._keyGroup.forEach((v, k) => {
            let renderNode = v[0];
            for (let i = 0; i < renderNode.materials.length; i++) {
                let material = renderNode.materials[i];
                let passes = material.renderPasses.get(passType);
                if (passes) {
                    for (let i = 0; i < passes.length; i++) {
                        const renderShader = passes[i].renderShader;// RenderShader.getShader(passes[i].shaderID);

                        renderShader.setDefine("USE_INSTANCEDRAW", true);
                        renderShader.setStorageBuffer(`instanceDrawID`, this._instanceMatrixBuffer);
                    }
                }
            }
            renderNode.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
        })
        super.nodeUpdate(view, passType, renderPassState, clusterLightingBuffer);
    }


    public renderPass(view: View3D, passType: RendererType, renderEncoder: RenderContext) {
        this._keyGroup.forEach((v, k) => {
            let renderNode = v[0];
            // for (let ii = 0; ii < v.length; ii++) {
            //     const renderNode = v[ii];
            //     renderNode.object3D.transform.updateWorldMatrix()
            // }
            for (let i = 0; i < renderNode.materials.length; i++) {
                const material = renderNode.materials[i];
                let passes = material.renderPasses.get(passType);

                if (!passes || passes.length == 0) continue;

                GPUContext.bindGeometryBuffer(renderEncoder.encoder, renderNode.geometry);
                let worldMatrix = renderNode.object3D.transform._worldMatrix;
                for (let j = 0; j < passes.length; j++) {
                    if (!passes || passes.length == 0) continue;
                    let matPass = passes[j];
                    if (!matPass.enable) continue;

                    for (let jj = passes.length > 1 ? 1 : 0; jj < passes.length; jj++) {
                        const renderShader = matPass.renderShader;
                        if (renderShader.shaderState.splitTexture) {

                            renderEncoder.endRenderPass();
                            RTResourceMap.WriteSplitColorTexture(renderNode.instanceID);
                            renderEncoder.beginRenderPass();

                            GPUContext.bindCamera(renderEncoder.encoder, view.camera);
                            GPUContext.bindGeometryBuffer(renderEncoder.encoder, renderNode.geometry);
                        }
                        GPUContext.bindPipeline(renderEncoder.encoder, renderShader);
                        let subGeometries = renderNode.geometry.subGeometries;
                        for (let k = 0; k < subGeometries.length; k++) {
                            const subGeometry = subGeometries[k];
                            let lodInfos = subGeometry.lodLevels;
                            let lodInfo = lodInfos[renderNode.lodLevel];

                            GPUContext.drawIndexed(renderEncoder.encoder, lodInfo.indexCount, v.length, lodInfo.indexStart, 0, 0);
                        }
                    }
                }
            }
        })

    }
}

