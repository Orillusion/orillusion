import { GeometryBase } from '../../../core/geometry/GeometryBase';
import { VertexAttributeName } from '../../../core/geometry/VertexAttributeName';
import { StorageGPUBuffer } from '../../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer';
import { Vector3 } from '../../../math/Vector3';
import { ImageType } from '../GUIConfig';
import { UITransform } from '../uiComponents/UITransform';
import { GUIQuadAttrEnum } from './GUIDefine';
import { GUIQuad } from './GUIQuad';

class GUIAttribute {
    public array: Float32Array;
    public buffer: StorageGPUBuffer;
    constructor(count: number) {
        this.buffer = new StorageGPUBuffer(count, 0);
        this.array = new Float32Array(this.buffer.memory.shareDataBuffer);
    }
}

/**
 * composite geometry of gui, holding and updating attribute data
 * @group GPU GUI
 */
export class GUIGeometry extends GeometryBase {
    private _attributeUV: Float32Array;
    private _attributeVIndex: Float32Array;
    private _faceIndexes: Uint32Array;

    private _uvSize: number = 2;
    private _vIndexSize: number = 1;

    private _posAttribute: GUIAttribute;//Position data per vertex
    private _spriteAttribute: GUIAttribute;//data per quad,texture id...
    private _colorAttribute: GUIAttribute;//data per quad: Color
    private _onPositionChange: boolean = true;
    private _onSpriteChange: boolean = true;
    private _onColorChange: boolean = true;

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

    updateSubGeometry(index: number, start: number, count: number) {
        let geom = this.subGeometries[index];
        if (geom) {
            let desc = geom.lodLevels[0];
            desc.indexStart = start;
            desc.indexCount = count;
            desc.index = index;
        } else {
            geom = this.addSubGeometry({
                indexStart: start,
                indexCount: count,
                vertexStart: 0,
                vertexCount: 0,
                firstStart: 0,
                index: index,
                topology: 0,
            });
        }
        return geom;
    }

    resetSubGeometries() {
        for (let item of this.subGeometries) {
            let desc = item.lodLevels[0];
            desc.indexStart = 0;
            desc.indexCount = 0;
            desc.index = 0;
        }
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

    public getPositionBuffer(): StorageGPUBuffer {
        if (this._onPositionChange) {
            this._posAttribute.buffer.apply();
            this._onPositionChange = false;
        }
        return this._posAttribute.buffer;
    }

    public getSpriteBuffer(): StorageGPUBuffer {
        if (this._onSpriteChange) {
            this._spriteAttribute.buffer.apply();
            this._onSpriteChange = false;
        }
        return this._spriteAttribute.buffer;
    }

    public getColorBuffer(): StorageGPUBuffer {
        if (this._onColorChange) {
            this._colorAttribute.buffer.apply();
            this._onColorChange = false;
        }
        return this._colorAttribute.buffer;
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

        this.updateSubGeometry(0, 0, this._faceIndexes.length);

        return this;
    }

    private createBuffer(): void {
        let quadNum: number = this.maxQuadCount;

        //Each quad has 4 vertices,(left bottom right top)
        this._posAttribute = new GUIAttribute(quadNum * 4);

        //Each quad has : uvRec_size/uvBorder_size/uvSlice_size/textureID/visible
        this._spriteAttribute = new GUIAttribute(quadNum * (4 + 4 + 2 + 2));

        this._colorAttribute = new GUIAttribute(quadNum * 4);
    }

    public fillQuad(quad: GUIQuad, transform: UITransform) {
        if (quad.dirtyAttributes & GUIQuadAttrEnum.POSITION) {
            this.fillQuadPosition(quad, transform);
        }
        if (quad.dirtyAttributes & GUIQuadAttrEnum.COLOR) {
            this.fillQuadColor(quad, transform);
        }
        if (quad.dirtyAttributes & GUIQuadAttrEnum.SPRITE) {
            this.fillQuadSprite(quad, transform);
        }
    }

    private fillQuadPosition(quad: GUIQuad, transform: UITransform): void {
        SetBufferDataV4.setXYZW(this._posAttribute.array, quad.z, quad.left, quad.bottom, quad.right, quad.top);

        this._onPositionChange = true;
    }

    private fillQuadColor(quad: GUIQuad, transform: UITransform): void {
        let color = quad.color;
        let array = this._colorAttribute.array;
        SetBufferDataV4.setXYZW(array, quad.z, color.r, color.g, color.b, color.a);

        this._onColorChange = true;
    }

    private fillQuadSprite(quad: GUIQuad, transform: UITransform) {
        let texture = quad.sprite;

        let uvSliceWidth: number = 0;
        let uvSliceHeight: number = 0;

        if (texture.isSliced && quad.imageType == ImageType.Sliced) {
            uvSliceWidth = texture.trimSize.x;
            uvSliceWidth = (transform.width - (texture.offsetSize.z - texture.trimSize.x)) / uvSliceWidth;

            uvSliceHeight = texture.trimSize.y;
            uvSliceHeight = (transform.height - (texture.offsetSize.w - texture.trimSize.y)) / uvSliceHeight;
        }

        let textureID = texture.guiTexture.dynamicId;
        let uvRec = texture.uvRec;
        let uvBorder = texture.uvBorder;
        //Each quad has: uvRec_size/uvBorder_size/uvSlice_size/textureID/visible

        let spriteArray = this._spriteAttribute.array;
        let offset = (4 + 4 + 2 + 2) * quad.z;

        spriteArray[offset + 0] = uvRec.x;
        spriteArray[offset + 1] = uvRec.y;
        spriteArray[offset + 2] = uvRec.z;
        spriteArray[offset + 3] = uvRec.w;

        spriteArray[offset + 4] = uvBorder.x;
        spriteArray[offset + 5] = uvBorder.y;
        spriteArray[offset + 6] = uvBorder.z;
        spriteArray[offset + 7] = uvBorder.w;

        spriteArray[offset + 8] = uvSliceWidth;
        spriteArray[offset + 9] = uvSliceHeight;
        spriteArray[offset + 10] = textureID;
        spriteArray[offset + 11] = quad.visible ? 1 : 0;

        this._onSpriteChange = true;
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
