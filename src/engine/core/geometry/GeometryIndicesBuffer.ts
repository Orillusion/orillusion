import { ArrayBufferData } from "../../gfx/graphics/webGpu/core/buffer/GPUBufferBase";
import { IndicesGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/IndicesGPUBuffer";
import { VertexAttributeData } from "./VertexAttributeData";


export class GeometryIndicesBuffer {
    public uuid: string = '';
    public name: string;
    public indicesGPUBuffer: IndicesGPUBuffer;
    public indicesFormat: GPUIndexFormat = `uint16`;
    public indicesCount: number = 0;
    constructor() {
    }

    public createIndicesBuffer(indicesData: VertexAttributeData) {
        if (indicesData.data instanceof Uint16Array) {
            this.indicesFormat = `uint16`;
        } else if (indicesData.data instanceof Uint32Array) {
            this.indicesFormat = `uint32`;
        }
        this.indicesCount = indicesData.data.length;
        this.indicesGPUBuffer = new IndicesGPUBuffer(indicesData.data);
    }

    public upload(data: ArrayBufferData) {
        this.indicesGPUBuffer.indicesNode.setArrayBuffer(0, data as ArrayBuffer);
        this.indicesGPUBuffer.apply();
    }

    public compute() {

    }

    /**
     * Get indices form geometry data 
     * Get position attribute form geometry data 
     * Get normal attribute form geometry data 
     * Get tangent attribute form geometry data 
     * Get uv0 attribute form geometry data 
     * Get uv1 attribute form geometry data 
     * Get uv2 attribute form geometry data 
     * 
     * Change position data to GPUBuffer and apply
     * Change normal data to GPUBuffer and apply
     * Change tangent data to GPUBuffer and apply
     * Change uv0 data to GPUBuffer and apply
     * Change uv1 data to GPUBuffer and apply
     * Change uv2 data to GPUBuffer and apply
     */
}