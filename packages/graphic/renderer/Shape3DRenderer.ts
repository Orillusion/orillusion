
import { ComputeShader, Ctor, DynamicFaceRenderer, Graphic3DFaceRenderer, OrderMap, StorageGPUBuffer, UniformGPUBuffer, Vector2, Vector4, View3D, graphicDynamicCompute } from "@orillusion/core";
import { Shape3DVertexCompute_cs } from "../compute/shape3d/Shape3DVertexCompute_cs";
import { Shape3DKeyPointCompute_cs } from "../compute/shape3d/Shape3DKeyPointCompute_cs";
import { Shape3D, Shape3DStruct } from "./shape3d/Shape3D";
import { Shape3DVertexFillZero_cs } from "../compute/shape3d/Shape3DVertexFillZero_cs";

export class Shape3DRenderer extends DynamicFaceRenderer {
    private _destPathBuffer: StorageGPUBuffer;
    private _srcPathFloat32Array: Float32Array;
    private _srcPathBuffer: StorageGPUBuffer;
    private _pathCompute: ComputeShader;
    private _vertexCompute: ComputeShader;
    private _clearVertexCompute: ComputeShader;
    private _rendererData: UniformGPUBuffer;
    private _shapeMap: OrderMap<string, Shape3D>;

    public init(param?: any): void {
        super.init(param);
        this._shapeMap = new OrderMap<string, Shape3D>(null, false, true);
    }

    public createShape<T extends Shape3D>(cls: Ctor<T>): T {
        let shape = new cls(this.nodes, this._srcPathFloat32Array, this._shapeMap.size);
        this._shapeMap.set(shape.instanceID, shape);
        return shape;
    }

    public removeShape(id: string): Shape3D {
        let shape = this._shapeMap.get(id);
        if (shape) {
            shape.clean();
            this._shapeMap.delete(id);
        }
        return shape;
    }

    protected initBaseBuffer(): void {
        let srcPathCount = Math.floor(this.maxFaceCount * 0.1);
        this._srcPathFloat32Array = new Float32Array(srcPathCount * 4);
        this._srcPathBuffer = new StorageGPUBuffer(srcPathCount * 4);

        this._destPathBuffer = new StorageGPUBuffer(this.maxFaceCount * 12);

        this._rendererData = new UniformGPUBuffer(4);
        this._rendererData.setFloat('usedShapeCount', 0);
        this._rendererData.setFloat('usedDestPointCount', 0);
        this._rendererData.setFloat('maxFaceCount', 0);
        this._rendererData.setFloat('usedFaceCount', 0);

        super.initBaseBuffer();
    }

    protected createComputeKernel(): void {
        this._pathCompute = new ComputeShader(graphicDynamicCompute(Shape3DKeyPointCompute_cs));
        this._pathCompute.setStorageBuffer("srcPathBuffer", this._srcPathBuffer);
        this._pathCompute.setStorageBuffer("destPathBuffer", this._destPathBuffer);
        this._pathCompute.setUniformBuffer("rendererData", this._rendererData);
        this._pathCompute.workerSizeX = 1;

        this._onChangeKernelGroup.push(this._pathCompute);

        this._vertexCompute = new ComputeShader(graphicDynamicCompute(Shape3DVertexCompute_cs));
        this._vertexCompute.setStorageBuffer("srcPathBuffer", this._srcPathBuffer);
        this._vertexCompute.setStorageBuffer("destPathBuffer", this._destPathBuffer);
        this._vertexCompute.setUniformBuffer("rendererData", this._rendererData);
        this._vertexCompute.workerSizeX = 1;

        this._clearVertexCompute = new ComputeShader(graphicDynamicCompute(Shape3DVertexFillZero_cs));
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
        let usedShapeCount = 0;
        let usedFaceCount = 0;
        let usedSrcPoints = 0;

        for (let shapeData of this._shapeMap.valueList) {
            shapeData.destPointStart = usedDestPointCount;
            shapeData.srcPointStart = usedSrcPoints;

            shapeData.shapeIndex = usedShapeCount;
            isRenderChange ||= shapeData.isChange;

            usedDestPointCount += shapeData.destPointCount;
            usedFaceCount += shapeData.faceCount;

            usedShapeCount++;
        }

        if (isRenderChange) {
            this._rendererData.setFloat('usedShapeCount', usedShapeCount);
            this._rendererData.setFloat('usedDestPointCount', usedDestPointCount);
            this._rendererData.setFloat('maxFaceCount', this.maxFaceCount);
            this._rendererData.setFloat('usedFaceCount', usedFaceCount);
            this._rendererData.apply();

            this._srcPathBuffer.setFloat32Array('points', this._srcPathFloat32Array);
            this._srcPathBuffer.apply();

            this._vertexCompute.workerSizeX = Math.floor(usedDestPointCount / 256) + 1;
            this._pathCompute.workerSizeX = Math.floor(usedShapeCount / 256) + 1;

            this.updateShape();

            this._shapeMap.isChange = false;
        }
    }

    public onUpdate(view?: View3D): void {
        this.updateShapeRenderer();
        super.onUpdate?.(view);
    }

}