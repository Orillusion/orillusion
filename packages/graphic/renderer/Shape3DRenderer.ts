
import { BitmapTexture2DArray, ComputeShader, Ctor, DynamicDrawStruct, DynamicFaceRenderer, Object3D, OrderMap, StorageGPUBuffer, UniformGPUBuffer, Vector2, Vector3, Vector4, View3D, graphicDynamicCompute } from "@orillusion/core";
import { Shape3DVertexCompute_cs } from "../compute/shape3d/Shape3DVertexCompute_cs";
import { Shape3DKeyPointCompute_cs } from "../compute/shape3d/Shape3DKeyPointCompute_cs";
import { Shape3D } from "./shape3d/Shape3D";
import { Shape3DVertexFillZero_cs } from "../compute/shape3d/Shape3DVertexFillZero_cs";

export class Shape3DRenderer extends DynamicFaceRenderer {
    private _destPathBuffer: StorageGPUBuffer;
    private _srcIndexUint32Array: Uint32Array;
    private _srcIndexBuffer: StorageGPUBuffer;
    private _srcPathFloat32Array: Float32Array;
    private _srcPathBuffer: StorageGPUBuffer;
    private _pathCompute: ComputeShader;
    private _vertexCompute: ComputeShader;
    private _clearVertexCompute: ComputeShader;
    private _rendererData: UniformGPUBuffer;
    private _shapeMap: OrderMap<number, Shape3D>;
    private _freeShapes: number[] = [];

    private _zFightingScale: number = 1.0;
    public init(param?: any): void {
        super.init(param);
        this._shapeMap = new OrderMap<number, Shape3D>(null, false, true);
    }

    public set<T extends DynamicDrawStruct>(nodeStruct: Ctor<T>, tex: BitmapTexture2DArray, standAloneMatrix?: boolean): void {
        super.set(nodeStruct, tex, standAloneMatrix);
        this._freeShapes = [];
        for (let i = 0, count = this.nodes.length; i < count; i++) {
            this._freeShapes.push(i);
        }
    }

    public createShape<T extends Shape3D>(cls: Ctor<T>): T {
        let destShapeID = this._freeShapes.shift();
        let struct = this.nodes[destShapeID];
        let shape3D = new cls(struct, this._srcPathFloat32Array, this._srcIndexUint32Array, destShapeID);
        this._shapeMap.set(destShapeID, shape3D);
        this.resetShape3DTransform(shape3D);
        return shape3D;
    }

    private resetShape3DTransform(shape: Shape3D) {
        let object3D = this.getShapeObject3D(shape);
        if (object3D) {
            object3D.localPosition = Vector3.ZERO;
            object3D.localScale = Vector3.ONE;
            object3D.localRotation = Vector3.ZERO;
        }
    }

    public getShapeObject3D(shape: Shape3D): Object3D {
        let index = shape.shapeIndex;
        return this.object3Ds[index];
    }

    public removeShape(shapeIndex: number): Shape3D {
        let shape = this._shapeMap.get(shapeIndex);
        if (shape) {
            if (!this._freeShapes.includes(shapeIndex)) {
                this._freeShapes.unshift(shapeIndex);
            }
            shape.clean();
            this._shapeMap.delete(shapeIndex);
        }
        return shape;
    }

    protected initBaseBuffer(): void {
        let srcPathCount = Math.floor(this.maxFaceCount * 0.1);

        this._srcIndexUint32Array = new Uint32Array(srcPathCount * 4);
        this._srcIndexBuffer = new StorageGPUBuffer(srcPathCount * 4);

        this._srcPathFloat32Array = new Float32Array(srcPathCount * 4);
        this._srcPathBuffer = new StorageGPUBuffer(srcPathCount * 4);

        this._destPathBuffer = new StorageGPUBuffer(this.maxFaceCount * 12);

        this._rendererData = new UniformGPUBuffer(4);
        this._rendererData.setFloat('maxNodeCount', this.maxNodeCount);
        this._rendererData.setFloat('usedDestPointCount', 0);
        this._rendererData.setFloat('maxFaceCount', this.maxFaceCount);
        this._rendererData.setFloat('zFightingScale', this._zFightingScale);

        super.initBaseBuffer();
    }

    protected createComputeKernel(): void {
        this._pathCompute = new ComputeShader(graphicDynamicCompute(Shape3DKeyPointCompute_cs));
        this._pathCompute.setStorageBuffer("srcIndexBuffer", this._srcIndexBuffer);
        this._pathCompute.setStorageBuffer("srcPathBuffer", this._srcPathBuffer);
        this._pathCompute.setStorageBuffer("destPathBuffer", this._destPathBuffer);
        this._pathCompute.setUniformBuffer("rendererData", this._rendererData);
        this._pathCompute.workerSizeX = 1;

        this._onChangeKernelGroup.push(this._pathCompute);

        this._vertexCompute = new ComputeShader(graphicDynamicCompute(Shape3DVertexCompute_cs));
        this._vertexCompute.setStorageBuffer("srcIndexBuffer", this._srcIndexBuffer);
        this._vertexCompute.setStorageBuffer("srcPathBuffer", this._srcPathBuffer);
        this._vertexCompute.setStorageBuffer("destPathBuffer", this._destPathBuffer);
        this._vertexCompute.setUniformBuffer("rendererData", this._rendererData);
        this._vertexCompute.workerSizeX = 1;

        this._clearVertexCompute = new ComputeShader(graphicDynamicCompute(Shape3DVertexFillZero_cs));
        this._clearVertexCompute.setStorageBuffer("srcIndexBuffer", this._srcIndexBuffer);
        this._clearVertexCompute.setStorageBuffer("srcPathBuffer", this._srcPathBuffer);
        this._clearVertexCompute.setStorageBuffer("destPathBuffer", this._destPathBuffer);
        this._clearVertexCompute.setUniformBuffer("rendererData", this._rendererData);
        this._clearVertexCompute.workerSizeX = Math.floor(this.maxFaceCount * 3 / 256) + 1;

        this._onChangeKernelGroup.push(this._clearVertexCompute);
        this._onChangeKernelGroup.push(this._vertexCompute);
    }

    private updateShapeRenderer(): void {
        let isRenderChange: boolean = this._shapeMap.isChange;

        let usedDestPointCount = 0;
        let usedSrcPoints = 0;
        let usedSrcIndecies = 0;

        for (let shapeData of this._shapeMap.valueList) {
            shapeData.destPointStart = usedDestPointCount;
            shapeData.srcPointStart = usedSrcPoints;
            shapeData.srcIndexStart = usedSrcIndecies;

            shapeData.isChange && shapeData.calcRequireSource();

            isRenderChange ||= shapeData.isChange;

            usedDestPointCount += shapeData.destPointCount;
            usedSrcIndecies += shapeData.srcIndexCount;
        }

        if (isRenderChange) {
            for (let shapeData of this._shapeMap.valueList) {
                shapeData.writeData();
            }
        }

        if (isRenderChange) {
            this._rendererData.setFloat('maxNodeCount', this.maxNodeCount);
            this._rendererData.setFloat('usedDestPointCount', usedDestPointCount);
            this._rendererData.setFloat('maxFaceCount', this.maxFaceCount);
            this._rendererData.setFloat('zFightingScale', this._zFightingScale);
            this._rendererData.apply();

            this._srcPathBuffer.setFloat32Array('points', this._srcPathFloat32Array);
            this._srcPathBuffer.apply();

            this._srcIndexBuffer.setUint32Array('points', this._srcIndexUint32Array);
            this._srcIndexBuffer.apply();

            this._vertexCompute.workerSizeX = Math.floor(usedDestPointCount / 256) + 1;
            this._pathCompute.workerSizeX = Math.floor(this.maxNodeCount / 256) + 1;

            this.updateShape();

            this._shapeMap.isChange = false;
        }
    }


    public onUpdate(view?: View3D): void {
        this.updateShapeRenderer();
        super.onUpdate?.(view);
    }

}