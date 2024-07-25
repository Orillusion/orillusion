import { Struct, MeshRenderer, BitmapTexture2DArray, StorageGPUBuffer, ComputeShader, StructStorageGPUBuffer, TriGeometry, UnLitTexArrayMaterial, Object3D, Color, Vector4, GlobalBindGroup, View3D, GPUContext } from "@orillusion/core";
import { ShapeInfo } from "./ShapeInfo";
import { GraphicLineCompute } from "../../compute/graphic3d/GraphicLineCompute";


export enum LineJoin {
    bevel = 0,
    miter = 1,
    round = 2
}

export enum LineCap {
    butt = 0,
    square = 1,
    round = 2
}

export class DrawInfo extends Struct {
    skipFace: number = 0;
    skipFace2: number = 0;
    skipFace3: number = 0;
    skipFace4: number = 0;
}

export class GeometryInfo extends Struct {
    public index: number = 0;
    public faceStart: number = 0;
    public faceEnd: number = 0;
    public faceCount: number = 0;
}



export class Graphic3DFaceRenderer extends MeshRenderer {
    public static maxFaceCount: number = 1000000;
    public static maxGeometryCount: number = 1;
    public static maxPathPointCount: number = 100000;
    public static maxShapeCount: number = 1024;

    public texture: BitmapTexture2DArray;
    public transformBuffer: StorageGPUBuffer;

    private _onChange: boolean = false;
    private _computeGeoShader: ComputeShader;

    public geometryInfoBuffer: StructStorageGPUBuffer<GeometryInfo>;
    public shapeBuffer: StructStorageGPUBuffer<ShapeInfo>;
    public pathBuffer: StorageGPUBuffer;
    public drawBuffer: StorageGPUBuffer;

    public object3Ds: any[];
    public shapes: ShapeInfo[];
    public realDrawShape: number;
    public needUpdate: boolean = false;
    public init(): void {
        super.init();
    }

    public create(tex: BitmapTexture2DArray, num: number) {
        this._computeGeoShader = new ComputeShader(GraphicLineCompute());
        this.geometryInfoBuffer = new StructStorageGPUBuffer<GeometryInfo>(GeometryInfo, Graphic3DFaceRenderer.maxGeometryCount);
        this.shapeBuffer = new StructStorageGPUBuffer<ShapeInfo>(ShapeInfo, Graphic3DFaceRenderer.maxShapeCount);
        this.pathBuffer = new StorageGPUBuffer(Graphic3DFaceRenderer.maxPathPointCount * 4);
        this.drawBuffer = new StorageGPUBuffer(4);

        let geo = new TriGeometry(Graphic3DFaceRenderer.maxFaceCount)
        let mat = new UnLitTexArrayMaterial();
        mat.baseMap = tex;
        this.material = mat;

        this.transformBuffer = new StorageGPUBuffer(num * (7 * 4), 0);
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
            this.transformBuffer.setColor("lineColor_" + i, new Color());
            this.transformBuffer.setColor("emissiveColor_" + i, new Color(0, 0, 0, 0));
            this.transformBuffer.setVector4("uvRect_" + i, new Vector4(0, 0, 1, 1));
            this.transformBuffer.setVector4("uvRect2_" + i, new Vector4(0, 0, 1, 1));
            this.transformBuffer.setVector4("uvSpeed_" + i, new Vector4(0, 0, 0, 0));
            console.log("create dynamic geometry", i);
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
        this.geometryInfoBuffer.setStructArray(GeometryInfo, geos);
        this.geometryInfoBuffer.apply();

        this.shapes = [];
        for (let i = 0; i < Graphic3DFaceRenderer.maxShapeCount; i++) {
            this.shapes.push(new ShapeInfo());
        }
        this.shapeBuffer.setStructArray(ShapeInfo, this.shapes);
        this.shapeBuffer.apply();

        this.start = () => {
            this._computeGeoShader.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
            this._computeGeoShader.setStructStorageBuffer("geometryInfoBuffer", this.geometryInfoBuffer);
            this._computeGeoShader.setStructStorageBuffer("shapeBuffer", this.shapeBuffer);
            this._computeGeoShader.setStorageBuffer("pathBuffer", this.pathBuffer);
            this._computeGeoShader.setStorageBuffer("drawBuffer", this.drawBuffer);
            // this._computeGeoShader.setStorageBuffer("models", GlobalBindGroup.modelMatrixBindGroup.matrixBufferDst);
            this._computeGeoShader.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
        }

    }

    public setShape(index: number, shape: ShapeInfo) {
        this.shapeBuffer.setStruct(ShapeInfo, index, shape);
        this.shapes ||= [];
        this.shapes[index] = shape;
        this.shapeBuffer.apply();
    }

    public updateShape() {
        let offset = 0;
        this.realDrawShape = 0;
        for (let i = 0; i < this.shapes.length; i++) {
            const shapeInfo = this.shapes[i];
            shapeInfo.pathCount = shapeInfo.paths.length;
            if (shapeInfo.pathCount > 0) {
                this.realDrawShape++;
            }
            shapeInfo.startPath = offset;
            offset += shapeInfo.paths.length;
            for (let j = 0; j < shapeInfo.pathCount; j++) {
                this.pathBuffer.setVector4(`${i}_path_${j}`, shapeInfo.paths[j]);
            }
            this.shapeBuffer.setStruct(ShapeInfo, i, shapeInfo);
        }
        this.shapeBuffer.apply();
        this.pathBuffer.apply();

        this.needUpdate = true;
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

    public onCompute(view: View3D, command: GPUCommandEncoder): void {
        if (this.needUpdate) {
            this.needUpdate = false;
            this.computeTrail(view, command);
        }
    }

    private computeTrail(view: View3D, command: GPUCommandEncoder) {
        this._computeGeoShader.workerSizeX = this.realDrawShape;
        this._computeGeoShader.workerSizeY = Math.floor(Graphic3DFaceRenderer.maxPathPointCount / 256 + 1);
        this._computeGeoShader.workerSizeZ = 1;
        GPUContext.computeCommand(command, [this._computeGeoShader]);
    }

}