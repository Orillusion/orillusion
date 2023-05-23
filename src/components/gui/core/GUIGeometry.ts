import { GeometryBase } from '../../../core/geometry/GeometryBase';
import { VertexAttributeName } from '../../../core/geometry/VertexAttributeName';
import { StorageGPUBuffer } from '../../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer';
import { Vector3 } from '../../../math/Vector3';
import { ImageType } from '../GUIConfig';
import { UITransform } from '../uiComponents/UITransform';
import { GUIQuad } from './GUIQuad';

export class GUIGeometry extends GeometryBase {
    private _attributeUV: Float32Array;
    private _attributeVIndex: Float32Array;
    private _faceIndexes: Uint32Array;

    private _uvSize: number = 2;
    private _vIndexSize: number = 1;

    private _vPosition: StorageGPUBuffer;//Position data per vertex
    private _vUniform: StorageGPUBuffer;//data per quad: Color, and texture id...

    private _positionArray: Float32Array;
    private _uniformArray: Float32Array;

    private _onPositionChange: boolean = true;
    private _onUniformChange: boolean = true;

    public readonly maxQuadCount: number;

    /**
     * constructor
     * @param max max quad of a geometry
     * @returns GUIGeometry
     */
    constructor(max: number) {
        super();
        this.maxQuadCount = max;
    }

    /**
     * the bounds will be set to infinity
     * @returns GUIGeometry
     */
    public updateBounds(min?: Vector3, max?: Vector3): this {
        let halfMax = Number.MAX_VALUE * 0.1;
        min = new Vector3(-halfMax, -halfMax, -halfMax);
        max = new Vector3(halfMax, halfMax, halfMax);
        this.bounds.setFromMinMax(min, max);
        return this;
    }

    public get vPositionBuffer(): StorageGPUBuffer {
        if (this._onPositionChange) {
            this._vPosition.apply();
            this._onPositionChange = false;
        }
        return this._vPosition;
    }

    public get vUniformBuffer(): StorageGPUBuffer {
        if (this._onUniformChange) {
            this._vUniform.apply();
            this._onUniformChange = false;
        }
        return this._vUniform;
    }

    public create(): this {
        this.createBuffer();
        this.updateBounds();
        let quadNum = this.maxQuadCount;
        let uvList = [];
        let vIndexList = [];
        for (let i = 0; i < quadNum; i++) {
            uvList.push(...QuadStruct.attUV);
        }

        for (let i = 0, count = this.maxQuadCount * QuadStruct.vertexCount; i < count; i++) {
            vIndexList[i] = i;
        }

        this._attributeUV = new Float32Array(QuadStruct.vertexCount * quadNum * this._uvSize);
        this._attributeVIndex = new Float32Array(QuadStruct.vertexCount * quadNum * this._vIndexSize);

        this._attributeUV.set(uvList, 0);
        this._attributeVIndex.set(vIndexList, 0);

        let indexList = [];
        for (let i = 0; i < quadNum; i++) {
            for (let j = 0; j < QuadStruct.indecies.length; j++) {
                const ind = QuadStruct.indecies[j] + i * 4;
                indexList.push(ind);
            }
        }

        this._faceIndexes = new Uint32Array(quadNum * 6);
        this._faceIndexes.set(indexList, 0);


        this.setIndices(this._faceIndexes);

        this.setAttribute(VertexAttributeName.uv, this._attributeUV);
        this.setAttribute(VertexAttributeName.vIndex, this._attributeVIndex);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: this._faceIndexes.length,
            vertexStart: 0,
            index: 0,
        });
        return this;
    }


    private createBuffer(): void {
        let quadNum: number = this.maxQuadCount;
        //Each quad has 4 vertices, and each vertex has 2 data points
        let sizePositionArray = quadNum * 4 * 2;
        this._vPosition = new StorageGPUBuffer(sizePositionArray, 0);
        this._positionArray = new Float32Array(this._vPosition.memory.shareDataBuffer);
        //Each quad has : color/uvRec_size/uvBorder_size/uvSlice_size/textureID/visible
        let sizeUniformArray = quadNum * (4 + 4 + 4 + 2 + 2);
        this._vUniform = new StorageGPUBuffer(sizeUniformArray, 0);
        this._uniformArray = new Float32Array(this._vUniform.memory.shareDataBuffer);
    }

    public updateQuad(quad: GUIQuad, transform: UITransform) {
        this.updateQuadVertex(quad, transform);

        this.updateQuadUniform(quad, transform);
    }

    private updateQuadVertex(quad: GUIQuad, transform: UITransform): void {
        let qi = quad.z * QuadStruct.vertexCount;

        let vi = 0;
        SetBufferDataV2.setXY(this._positionArray, qi + vi, quad.left, quad.top);

        vi = 1;
        SetBufferDataV2.setXY(this._positionArray, qi + vi, quad.right, quad.top);

        vi = 2;
        SetBufferDataV2.setXY(this._positionArray, qi + vi, quad.right, quad.bottom);

        vi = 3;
        SetBufferDataV2.setXY(this._positionArray, qi + vi, quad.left, quad.bottom);

        this._onPositionChange = true;
    }

    private updateQuadUniform(quad: GUIQuad, transform: UITransform) {
        let texture = quad.sprite;

        let uvSliceWidth: number = 0;
        let uvSliceHeight: number = 0;

        if (texture.isSliced && quad.imageType == ImageType.Sliced) {
            uvSliceWidth = texture.trimSize.x;
            uvSliceWidth = (transform.width - (texture.offsetSize.z - texture.trimSize.x)) / uvSliceWidth;

            uvSliceHeight = texture.trimSize.y;
            uvSliceHeight = (transform.height - (texture.offsetSize.w - texture.trimSize.y)) / uvSliceHeight;
        }

        let i = quad.z;
        let textureID = texture.guiTexture.dynamicId;
        let color = quad.color;
        let uvRec = texture.uvRec;
        let uvBorder = texture.uvBorder;
        //Each quad has: color/uvRec_size/uvBorder_size/uvSlice_size/textureID/visible

        let offset = (4 + 4 + 4 + 2 + 2) * i;
        this._uniformArray[offset + 0] = color.r;
        this._uniformArray[offset + 1] = color.g;
        this._uniformArray[offset + 2] = color.b;
        this._uniformArray[offset + 3] = color.a;

        this._uniformArray[offset + 4] = uvRec.x;
        this._uniformArray[offset + 5] = uvRec.y;
        this._uniformArray[offset + 6] = uvRec.z;
        this._uniformArray[offset + 7] = uvRec.w;

        this._uniformArray[offset + 8] = uvBorder.w;
        this._uniformArray[offset + 9] = uvBorder.y;
        this._uniformArray[offset + 10] = uvBorder.z;
        this._uniformArray[offset + 11] = uvBorder.w;

        this._uniformArray[offset + 12] = uvSliceWidth;
        this._uniformArray[offset + 13] = uvSliceHeight;
        this._uniformArray[offset + 14] = textureID;
        this._uniformArray[offset + 15] = quad.visible ? 1 : 0;

        this._onUniformChange = true;
    }

    reset(z: number) {
        let qi = z * QuadStruct.vertexCount;
        let max = this.maxQuadCount * QuadStruct.vertexCount;
        for (let i = qi; i < max; i++) {
            SetBufferDataV2.setXY(this._positionArray, i, 0, 0);
        }
        this._onPositionChange = true;
    }

}

class SetBufferData {
    public static set(array: Float32Array, index: number, offset: number, stride: number, ...args) {
        let from = index * stride + offset;
        for (let i = 0, c = args.length; i < c; i++) {
            array[from + i] = args[i];
        }
    }
}

class SetBufferDataV4 extends SetBufferData {
    static setXYZW(array: Float32Array, index: number, x: number, y: number, z: number, w: number) {
        this.set(array, index, 0, 4, x, y, z, w);
    }

    static setXYZ(array: Float32Array, index: number, x: number, y: number, z: number) {
        this.set(array, index, 0, 4, x, y, z);
    }

    static setZ(array: Float32Array, index: number, z: number) {
        this.set(array, index, 3, 4, z);
    }
}

class SetBufferDataV3 extends SetBufferData {
    static setXY(array: Float32Array, index: number, x: number, y: number) {
        this.set(array, index, 0, 3, x, y);
    }

    static setXYZ(array: Float32Array, index: number, x: number, y: number, z: number) {
        this.set(array, index, 0, 3, x, y, z);
    }

    static setZ(array: Float32Array, index: number, z: number) {
        this.set(array, index, 2, 3, z);
    }
}

class SetBufferDataV2 extends SetBufferData {
    static setXY(array: Float32Array, index: number, x: number, y: number) {
        this.set(array, index, 0, 2, x, y);
    }
}

class QuadStruct {
    public static vertexCount: number = 4;
    public static attUV: number[] = [0, 0, 1, 0, 1, 1, 0, 1];
    public static indecies: number[] = [0, 1, 2, 0, 2, 3];
}
