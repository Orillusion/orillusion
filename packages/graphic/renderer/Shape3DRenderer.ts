
import { BitmapTexture2DArray, ComputeShader, Ctor, Object3D, OrderMap, StorageGPUBuffer, UniformGPUBuffer, Vector3, Vector4, View3D } from "@orillusion/core";
import { Shape3DVertexCompute_cs } from "../compute/shape3d/Shape3DVertexCompute_cs";
import { Shape3DKeyPointCompute_cs } from "../compute/shape3d/Shape3DKeyPointCompute_cs";
import { Shape3D } from "./shape3d/Shape3D";
import { Shape3DVertexFillZero_cs } from "../compute/shape3d/Shape3DVertexFillZero_cs";
import { DynamicFaceRenderer } from "./graphic3d/DynamicFaceRenderer";
import { DynamicDrawStruct } from "./graphic3d/DynamicDrawStruct";
import { graphicDynamicCompute } from "../compute/graphic3d/GraphicDynamicCompute";

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
    private _cameraUp: Vector4;
    private _cameraPos: Vector4;

    public init(param?: any): void {
        this._cameraUp = new Vector4();
        this._cameraPos = new Vector4();
        this._shapeMap = new OrderMap<number, Shape3D>(null, false, true);
        super.init(param);
    }

    public set<T extends DynamicDrawStruct>(nodeStruct: Ctor<T>, tex: BitmapTexture2DArray, standAloneMatrix?: boolean): void {
        super.set(nodeStruct, tex, standAloneMatrix);
        this._freeShapes = [];
        for (let i = 0, count = this.nodes.length; i < count; i++) {
            this._freeShapes.push(i);
        }
    }


    /**
     * Create a shape3D by Shape3D constructor
     *
     * @template T
     * @param {Ctor<T>} cls
     * @return {*}  {T}
     * @memberof Shape3DRenderer
     */
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


    /**
     * Get binded Object3D objects based on Shape3D. And then you can control Shape3D through the Object 3D transform
     * 
     * @param {Shape3D} shape
     * @return {*}  {Object3D}
     * @memberof Shape3DRenderer
     */
    public getShapeObject3D(shape: Shape3D): Object3D {
        let index = shape.shapeIndex;
        return this.object3Ds[index];
    }


    /**
     * Remove a Shape3D by index
     *
     * @param {number} shapeIndex
     * @return {*}  {Shape3D}
     * @memberof Shape3DRenderer
     */
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

        //config :4; mv matrix, inverted mv matrix: 16 * 2
        this._rendererData = new UniformGPUBuffer(4 + 16 * 2);
        this._rendererData.setVector4('cameraUp', this._cameraUp);
        this._rendererData.setVector4('cameraPos', this._cameraPos);
        this._rendererData.setFloat('maxNodeCount', this.maxNodeCount);
        this._rendererData.setFloat('usedDestPointCount', 0);
        this._rendererData.setFloat('maxFaceCount', this.maxFaceCount);
        this._rendererData.setFloat('zFightingRange', this._zFightingScale);


        super.initBaseBuffer();
    }

    protected createComputeKernel(): void {
        this._pathCompute = new ComputeShader(graphicDynamicCompute(Shape3DKeyPointCompute_cs));
        this._pathCompute.setStorageBuffer("srcIndexBuffer", this._srcIndexBuffer);
        this._pathCompute.setStorageBuffer("srcPathBuffer", this._srcPathBuffer);
        this._pathCompute.setStorageBuffer("destPathBuffer", this._destPathBuffer);
        this._pathCompute.setUniformBuffer("rendererData", this._rendererData);
        this._pathCompute.workerSizeX = Math.floor(this.maxNodeCount / 256) + 1;

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

    private updateShapeRenderer(view?: View3D): void {
        let isRenderChange: boolean = this._shapeMap.isChange;
        let computeByFrame = false;
        let usedDestPointCount = 0;
        let usedSrcPoints = 0;
        let usedSrcIndecies = 0;

        for (let shapeData of this._shapeMap.valueList) {
            shapeData.destPointStart = usedDestPointCount;
            shapeData.srcPointStart = usedSrcPoints;
            shapeData.srcIndexStart = usedSrcIndecies;

            shapeData.isChange && shapeData.calcRequireSource();

            isRenderChange ||= shapeData.isChange;
            computeByFrame ||= shapeData.computeEveryFrame;

            usedDestPointCount += shapeData.destPointCount;
            usedSrcIndecies += shapeData.srcIndexCount;
            usedSrcPoints += shapeData.srcPointCount;
        }

        if (isRenderChange) {
            for (let shapeData of this._shapeMap.valueList) {
                shapeData.writeData();
                let shapeIndex = shapeData.shapeIndex;
                this.setUVRect(shapeIndex, shapeData.fillUVRect);
                this.setUVRect2(shapeIndex, shapeData.lineUVRect);
                this.setUVSpeed(shapeIndex, shapeData.uvSpeed);
                this.setFillRotation(shapeIndex, shapeData.fillRotation);
                this.setBaseColor(shapeIndex, shapeData.fillColor);
                this.setLineColor(shapeIndex, shapeData.lineColor);
                this.setTextureID(shapeIndex, shapeData.fillTextureID);
                this.setLineTextureID(shapeIndex, shapeData.lineTextureID);
            }
        }

        //update viewMatrix
        if (isRenderChange || computeByFrame) {
            let transform = view.camera.transform;

            let up = this._cameraUp.set(0, 0, 1, 0) as any as Vector3;
            transform.worldMatrix.transformVector(up, up);
            this._rendererData.setVector4('cameraUp', this._cameraUp);

            this._cameraPos.copyFrom(transform.worldPosition as any);
            this._rendererData.setVector4('cameraPos', this._cameraPos);

            this._rendererData.setFloat('maxNodeCount', this.maxNodeCount);
            this._rendererData.setFloat('usedDestPointCount', usedDestPointCount);
            this._rendererData.setFloat('maxFaceCount', this.maxFaceCount);
            this._rendererData.setFloat('zFightingRange', this._zFightingScale);
            this._rendererData.apply();

            this._shapeMap.isChange = false;
        }

        if (isRenderChange) {
            this._srcPathBuffer.setFloat32Array('points', this._srcPathFloat32Array);
            this._srcPathBuffer.apply();

            this._srcIndexBuffer.setUint32Array('points', this._srcIndexUint32Array);
            this._srcIndexBuffer.apply();

            this._vertexCompute.workerSizeX = Math.floor(usedDestPointCount / 256) + 1;
            this.updateShape();
        } else if (computeByFrame) {
            this._needCompute = true;
        }

    }

    public onUpdate(view?: View3D): void {
        this.updateShapeRenderer(view);
        super.onUpdate?.(view);
    }

}