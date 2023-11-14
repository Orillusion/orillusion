import { graphicFaceCompute } from "../../../../../assets/shader/graphic/GraphicFaceCompute";
import { graphicTrailCompute } from "../../../../../assets/shader/graphic/GraphicTrailCompute";
import { MeshRenderer } from "../../../../../components/renderer/MeshRenderer";
import { View3D } from "../../../../../core/View3D";
import { Object3D } from "../../../../../core/entities/Object3D";
import { UnLitTexArrayMaterial } from "../../../../../materials/UnLitTexArrayMaterial";
import { Color } from "../../../../../math/Color";
import { Vector3 } from "../../../../../math/Vector3";
import { Vector4 } from "../../../../../math/Vector4";
import { TriGeometry } from "../../../../../shape/TriGeometry";
import { BitmapTexture2DArray } from "../../../../../textures/BitmapTexture2DArray";
import { GeometryUtil } from "../../../../../util/GeometryUtil";
import { Struct } from "../../../../../util/struct/Struct";
import { GlobalBindGroup } from "../../../../graphics/webGpu/core/bindGroups/GlobalBindGroup";
import { StorageGPUBuffer } from "../../../../graphics/webGpu/core/buffer/StorageGPUBuffer";
import { StructStorageGPUBuffer } from "../../../../graphics/webGpu/core/buffer/StructStorageGPUBuffer";
import { ComputeShader } from "../../../../graphics/webGpu/shader/ComputeShader";
import { GPUContext } from "../../../GPUContext";
import { Float32ArrayUtil } from "./Float32ArrayUtil";

export class GeometryInfo extends Struct {
    public index: number = 0;
    public faceStart: number = 0;
    public faceEnd: number = 0;
    public faceCount: number = 0;
}

export class ShapeInfo extends Struct {
    public shapeIndex: number = 0;; //face,poly,line,cycle,rectangle,box,sphere
    public shapeType: number = 0;
    public width: number = 0;
    public height: number = 0;
    public pathCount: number = 0;
    public uSpeed: number = 0;
    public vSpeed: number = 0;
    public radiu: number = 0;
    public paths: Float32Array = new Float32Array(Graphic3DFaceRenderer.maxPathPointCount * 4);
}

export class Graphic3DFaceRenderer extends MeshRenderer {
    public static maxFaceCount: number = 50000;
    public static maxGeometryCount: number = 1;
    public static maxShapeCount: number = 1;
    public static maxPathPointCount: number = 50;
    public texture: BitmapTexture2DArray;
    public transformBuffer: StorageGPUBuffer;

    private _onChange: boolean = false;
    private _computeGeoShader: ComputeShader;

    public geometryInfoBuffer: StructStorageGPUBuffer<GeometryInfo>;
    public shapeBuffer: StructStorageGPUBuffer<ShapeInfo>;

    object3Ds: any[];
    shapes: ShapeInfo[];
    public init(): void {
        super.init();
    }

    public create(tex: BitmapTexture2DArray, num: number) {
        this._computeGeoShader = new ComputeShader(graphicFaceCompute(Graphic3DFaceRenderer.maxPathPointCount));
        this.geometryInfoBuffer = new StructStorageGPUBuffer<GeometryInfo>(GeometryInfo, Graphic3DFaceRenderer.maxGeometryCount);
        this.shapeBuffer = new StructStorageGPUBuffer<ShapeInfo>(ShapeInfo, Graphic3DFaceRenderer.maxShapeCount);

        let geo = new TriGeometry(Graphic3DFaceRenderer.maxFaceCount)
        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = tex;
        this.material = mat;

        this.transformBuffer = new StorageGPUBuffer(num * (4 * 4), 0);
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
            this.transformBuffer.setColor("baseColor_" + i, new Color());
            this.transformBuffer.setColor("emissiveColor_" + i, new Color(0, 0, 0, 0));
            this.transformBuffer.setVector4("uvRect_" + i, new Vector4(0, 0, 1, 1));
        }

        this.transformBuffer.apply();
        this.geometry = geo;
    }

    public startShape(texture: BitmapTexture2DArray) {
        this.create(texture, Graphic3DFaceRenderer.maxGeometryCount);

        let geos = [];
        for (let i = 0; i < Graphic3DFaceRenderer.maxGeometryCount; i++) {
            const geometryInfo = new GeometryInfo();
            geos.push(geometryInfo);
        }
        this.shapeBuffer.setStructArray(GeometryInfo, geos);
        this.geometryInfoBuffer.apply();

        this.shapes = [];
        for (let i = 0; i < Graphic3DFaceRenderer.maxShapeCount; i++) {
            const shapeInfo = new ShapeInfo();
            this.shapes.push(shapeInfo);
        }
        this.shapeBuffer.setStructArray(ShapeInfo, this.shapes);
        this.shapeBuffer.apply();

        this.start = () => {
            this._computeGeoShader.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
            this._computeGeoShader.setStructStorageBuffer("geometryInfoBuffer", this.geometryInfoBuffer);
            this._computeGeoShader.setStructStorageBuffer("shapeBuffer", this.shapeBuffer);
            // this._computeGeoShader.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
            this._computeGeoShader.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
        }

        this.onCompute = (view: View3D, command: GPUCommandEncoder) => this.computeTrail(view, command);
    }

    public updateShape(index: number, shape: ShapeInfo) {
        this.shapeBuffer.setStruct(ShapeInfo, index, shape);
        this.shapeBuffer.apply();
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

    private computeTrail(view: View3D, command: GPUCommandEncoder) {
        // this._computeShader.workerSizeX = this.ribbonCount;
        this._computeGeoShader.workerSizeX = 1;// Math.floor(this.ribbonSegment / Graphic3DRibbonRenderer.maxRibbonSegment);
        this._computeGeoShader.workerSizeY = 4;// Math.floor(this.ribbonSegment / Graphic3DRibbonRenderer.maxRibbonSegment);
        // this._computeShader.workerSizeY = 1;// Math.floor(this.ribbonSegment / Graphic3DRibbonRenderer.maxRibbonSegment);
        // this._computeShader.workerSizeX = 1;
        GPUContext.computeCommand(command, [this._computeGeoShader]);
    }

}