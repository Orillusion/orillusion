import { Color, Vector4 } from "../../../../..";
import { MeshRenderer } from "../../../../../components/renderer/MeshRenderer";
import { View3D } from "../../../../../core/View3D";
import { Object3D } from "../../../../../core/entities/Object3D";
import { GeometryBase } from "../../../../../core/geometry/GeometryBase";
import { UnLitTexArrayMaterial } from "../../../../../materials/UnLitTexArrayMaterial";
import { BitmapTexture2DArray } from "../../../../../textures/BitmapTexture2DArray";
import { GeometryUtil } from "../../../../../util/GeometryUtil";
import { StorageGPUBuffer } from "../../../../graphics/webGpu/core/buffer/StorageGPUBuffer";

export class Graphic3DMeshRenderer extends MeshRenderer {
    public transformBuffer: StorageGPUBuffer;
    public sourceGeometry: GeometryBase;
    public texture: BitmapTexture2DArray;
    public object3Ds: Object3D[];

    private _onChange: boolean = false;
    public init(): void {
        super.init();
    }

    public create(source: GeometryBase, tex: BitmapTexture2DArray, num: number) {
        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = tex;
        this.material = mat;

        this.transformBuffer = new StorageGPUBuffer( num * (4 * 4) , 0);
        // this.transformBuffer = new StorageGPUBuffer( num * 2 , 0);
        this.material.setStorageBuffer("graphicBuffer", this.transformBuffer);

        this.object3Ds = [];
        for (let i = 0; i < num; i++) {
            const element = new Object3D();
            this.object3Ds.push(element);
            this.object3D.addChild(element);

            this.transformBuffer.setFloat("matrix_" + i, element.transform.worldMatrix.index);
            this.transformBuffer.setFloat("texId_" + i, 1);
            this.transformBuffer.setFloat("texId2_" + i, 1);
            this.transformBuffer.setFloat("texId3_" + i, 1);
            this.transformBuffer.setColor("baseColor_" + i, new Color() );
            this.transformBuffer.setColor("emissiveColor_" + i, new Color(0,0,0,0));
            this.transformBuffer.setVector4("uvRect_" + i, new Vector4(0,0,1,1) );
        }

        this.transformBuffer.apply();
        this.geometry = GeometryUtil.mergeNumber(source, num);
    }

    public setTextureID(i: number, id: number) {
        this.transformBuffer.setFloat("texId_" + i, id);
        this._onChange = true;
    }

    // public setTexture2ID(i: number, id: number) {
    //     this.transformBuffer.setFloat("texId_" + i, id);
    //     this._onChange = true;
    // }

    // public setTexture3ID(i: number, id: number) {
    //     this.transformBuffer.setFloat("texId_" + i, id);
    //     this._onChange = true;
    // }

    public setBaseColor(i: number, color: Color) {
        this.transformBuffer.setColor("baseColor_" + i, color);
        this._onChange = true;
    }

    public setEmissiveColor(i: number, color: Color) {
        this.transformBuffer.setColor("emissiveColor_" + i, color);
        this._onChange = true;
    }

    public setUVRect(i: number, v: Vector4) {
        this.transformBuffer.setVector4("uvRect_" + i, v);
        this._onChange = true;
    }

    public onUpdate(view?: View3D) {
        if (this._onChange) {
            this._onChange = false;
            this.transformBuffer.apply();
        }
    }

}