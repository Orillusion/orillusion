import { View3D } from "../../../../..";
import { MeshRenderer } from "../../../../../components/renderer/MeshRenderer";
import { RenderNode } from "../../../../../components/renderer/RenderNode";
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

        this.transformBuffer = new StorageGPUBuffer(num * 2, 0);
        this.material.setStorageBuffer("graphicBuffer", this.transformBuffer);

        this.object3Ds = [];
        for (let i = 0; i < num; i++) {
            const element = new Object3D();
            this.object3Ds.push(element);
            this.object3D.addChild(element);

            this.transformBuffer.setFloat("matrix_" + i, element.transform.worldMatrix.index);
            this.transformBuffer.setFloat("texId_" + i, 1);
        }

        this.transformBuffer.apply();
        this.geometry = GeometryUtil.mergeNumber(source, num);
    }

    public setTextureID(i: number, id: number) {
        this.transformBuffer.setFloat("texId_" + i, id);
        this._onChange = true;
    }

    public onUpdate(view?: View3D) {
        if (this._onChange) {
            this._onChange = false;
            this.transformBuffer.apply();
        }
    }

}