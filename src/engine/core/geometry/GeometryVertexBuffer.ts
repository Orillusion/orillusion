import { VertexGPUBuffer } from "../../gfx/graphics/webGpu/core/buffer/VertexGPUBuffer";
import { ShaderReflection } from "../../gfx/graphics/webGpu/shader/value/ShaderReflectionInfo";
import { VertexAttributeData } from "./VertexAttributeData";
import { GeometryVertexType } from "./GeometryVertexType";
import { VertexBufferLayout, VertexAttribute } from "./VertexAttribute";
import { VertexAttributeSize } from "./VertexAttributeSize";


export class GeometryVertexBuffer {
    public vertexCount: number = 0;
    public vertexGPUBuffer: VertexGPUBuffer;
    public geometryType: GeometryVertexType = GeometryVertexType.compose;
    private _vertexBufferLayouts: VertexBufferLayout[];
    private _attributeSlotLayouts: VertexAttribute[][];
    private _attributeLocation: { [attribute: string]: number };

    constructor() {
        this._vertexBufferLayouts = [];
        this._attributeLocation = {};
        this._attributeSlotLayouts = [];
    }

    public get vertexBufferLayouts() {
        return this._vertexBufferLayouts;
    }

    public createVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        switch (this.geometryType) {
            case GeometryVertexType.split:
                this.createSplitVertexBuffer(vertexDataInfos, shaderReflection);
                break;
            case GeometryVertexType.compose:
                this.createComposeVertexBuffer(vertexDataInfos, shaderReflection);
                break;
        }
    }

    private createSplitVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        let vertexOffset = 0;
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];

            if (attributeInfo.name == `index`) continue;
            this._attributeLocation[attributeInfo.name] = attributeInfo.location;

            let attributeLayout: VertexAttribute = {
                name: attributeInfo.name,
                format: attributeInfo.format,
                offset: 0,
                shaderLocation: attributeInfo.location,
                stride: VertexAttributeSize[attributeInfo.format]
            }

            this._attributeSlotLayouts[attributeInfo.location] = [attributeLayout];

            let vertexInfo = vertexDataInfos.get(attributeInfo.name);
            if (!vertexInfo) {
                vertexInfo = {
                    attribute: attributeInfo.name,
                    data: new Float32Array(attributeInfo.size * this.vertexCount)
                }
                vertexDataInfos.set(attributeInfo.name, vertexInfo);
            }
            let len = vertexInfo.data.length / attributeLayout.stride;
            if (this.vertexCount != 0 && this.vertexCount != len) {
                console.error(" vertex count not match attribute count");
            }
            this.vertexCount = len;


            this._vertexBufferLayouts[attributeInfo.location] = {
                name: attributeInfo.name,
                arrayStride: attributeInfo.size * 4,
                stepMode: `vertex`,
                attributes: this._attributeSlotLayouts[attributeInfo.location],
                offset: vertexOffset * 4,
                size: this.vertexCount * attributeInfo.size * 4
            }

            vertexOffset += this.vertexCount * attributeInfo.size;
        }

        this.vertexGPUBuffer = new VertexGPUBuffer(vertexOffset);
    }

    private createComposeVertexBuffer(vertexDataInfos: Map<string, VertexAttributeData>, shaderReflection: ShaderReflection) {
        this._attributeSlotLayouts[0] = [];

        let attributeOffset = 0;
        for (let i = 0; i < shaderReflection.attributes.length; i++) {
            const attributeInfo = shaderReflection.attributes[i];
            if (attributeInfo.name == `index`) continue;
            this._attributeLocation[attributeInfo.name] = attributeInfo.location;

            let attributeLayout: VertexAttribute = {
                name: attributeInfo.name,
                format: attributeInfo.format,
                offset: attributeOffset * 4,
                shaderLocation: attributeInfo.location,
                stride: VertexAttributeSize[attributeInfo.format]
            }
            this._attributeSlotLayouts[0][attributeInfo.location] = attributeLayout;

            let vertexInfo = vertexDataInfos.get(attributeInfo.name);
            if (!vertexInfo) {
                vertexInfo = {
                    attribute: attributeInfo.name,
                    data: new Float32Array(attributeInfo.size * this.vertexCount)
                }
                vertexDataInfos.set(attributeInfo.name, vertexInfo);
            }
            let len = vertexInfo.data.length / attributeLayout.stride;
            if (this.vertexCount != 0 && this.vertexCount != len) {
                console.error(" vertex count not match attribute count");
            }
            this.vertexCount = len;

            attributeOffset += attributeInfo.size;
        }

        this._vertexBufferLayouts[0] = {
            name: `composeStruct`,
            arrayStride: attributeOffset * 4,
            stepMode: `vertex`,
            attributes: this._attributeSlotLayouts[0],
            offset: 0,
            size: this.vertexCount * attributeOffset * 4
        }

        this.vertexGPUBuffer = new VertexGPUBuffer(this.vertexCount * attributeOffset);
    }

    public upload(attribute: string, vertexDataInfo: VertexAttributeData) {
        switch (this.geometryType) {
            case GeometryVertexType.split:
                {
                    let location = this._attributeLocation[attribute];
                    let vertexBufferLayout = this._vertexBufferLayouts[location];
                    this.vertexGPUBuffer.node.setFloat32Array(vertexBufferLayout.offset / 4, vertexDataInfo.data as Float32Array);
                }
                break;
            case GeometryVertexType.compose:
                {
                    for (let i = 0; i < this.vertexCount; i++) {
                        const attributeLayout = this._attributeSlotLayouts[0][this._attributeLocation[attribute]];
                        for (let k = 0; k < attributeLayout.stride; k++) {
                            let atData = vertexDataInfo.data[i * attributeLayout.stride + k];
                            let index = i * (this._vertexBufferLayouts[0].arrayStride / 4) + (attributeLayout.offset / 4) + k;
                            this.vertexGPUBuffer.node.setFloat(atData, index);
                        }
                    }
                }
                break;
        }
        this.vertexGPUBuffer.apply();
    }

    public updateAttributes(vertexDataInfos: Map<string, VertexAttributeData>) {
        switch (this.geometryType) {
            case GeometryVertexType.split:
                {
                    for (let i = 0; i < this._vertexBufferLayouts.length; i++) {
                        const vertexBufferLayout = this._vertexBufferLayouts[i];
                        let attributeData = vertexDataInfos.get(vertexBufferLayout.name);
                        this.vertexGPUBuffer.node.setFloat32Array(vertexBufferLayout.offset / 4, attributeData.data as Float32Array);
                    }
                }
                break;
            case GeometryVertexType.compose:
                {
                    for (let i = 0; i < this.vertexCount; i++) {
                        this._attributeSlotLayouts.forEach((v) => {
                            for (let j = 0; j < v.length; j++) {
                                const attributeLayout = v[j];
                                let attributeData = vertexDataInfos.get(attributeLayout.name);
                                for (let k = 0; k < attributeLayout.stride; k++) {
                                    let atData = attributeData.data[i * attributeLayout.stride + k];
                                    let index = i * (this._vertexBufferLayouts[0].arrayStride / 4) + (attributeLayout.offset / 4) + k;
                                    this.vertexGPUBuffer.node.setFloat(atData, index);
                                }
                            }
                        });
                    }
                }
                break;
        }
        this.vertexGPUBuffer.apply();
    }

    public compute() {

    }
}