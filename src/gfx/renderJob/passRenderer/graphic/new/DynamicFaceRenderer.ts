
import { BitmapTexture2DArray, Color, ComputeShader, Ctor, GPUContext, GlobalBindGroup, MeshRenderer, Object3D, StorageGPUBuffer, Struct, StructStorageGPUBuffer, TriGeometry, UnLitTexArrayMaterial, Vector3, Vector4, View3D } from "@orillusion/core";
import { DynamicDrawStruct } from "./DynamicDrawStruct";

export class DynamicFaceRenderer extends MeshRenderer {
    public texture: BitmapTexture2DArray;
    public transformBuffer: StorageGPUBuffer;
    public nodeStructBuffer: StructStorageGPUBuffer<DynamicDrawStruct>;
    public drawAtomicBuffer: StorageGPUBuffer;

    protected object3Ds: Object3D[];
    public nodes: DynamicDrawStruct[];

    protected _initCompute: boolean = false;
    protected _needCompute: boolean = false;
    protected _onBufferChange: boolean = false;

    protected _onStartKernel: ComputeShader[];
    protected _onChangeKernelGroup: ComputeShader[];
    protected _onFrameKernelGroup: ComputeShader[];

    protected nodeMat: UnLitTexArrayMaterial;
    protected maxFaceCount: number;
    protected maxNodeCount: number;
    private _nodeStruct: Ctor<DynamicDrawStruct>;
    public init(param?: any): void {
        super.init(param);
        let { maxFaceCount, maxNodeCount } = param;
        this.maxFaceCount = maxFaceCount;
        this.maxNodeCount = maxNodeCount;

        this._onStartKernel = [];
        this._onChangeKernelGroup = [];
        this._onFrameKernelGroup = [];

        this.initGeometryBuffer();
        this.initMaterial();
        this.initBaseBuffer();
        this.createComputeKernel();
    }

    protected initGeometryBuffer() {
        let geo = new TriGeometry(this.maxFaceCount)
        this.geometry = geo;
    }

    protected initMaterial() {
        this.material = this.nodeMat = new UnLitTexArrayMaterial();
        // this.material.doubleSide = true;

        this.transformBuffer = new StorageGPUBuffer(this.maxNodeCount * (8 * 4), 0);
        this.material.setStorageBuffer("graphicBuffer", this.transformBuffer);
    }

    protected initBaseBuffer() {
        this.drawAtomicBuffer = new StorageGPUBuffer(4);
        this.drawAtomicBuffer.setUint32("skipFace", 0.0);
        this.drawAtomicBuffer.setUint32("skipFace2", this.maxNodeCount);
        this.drawAtomicBuffer.setUint32("skipFace3", this.maxFaceCount);
        this.drawAtomicBuffer.setUint32("skipFace4", 0.0);
    }

    protected createComputeKernel() {
    }

    public set<T extends DynamicDrawStruct>(nodeStruct: Ctor<T>, tex: BitmapTexture2DArray, standAloneMatrix?: boolean) {
        this._nodeStruct = nodeStruct;
        this.nodeMat.baseMap = tex;

        this.nodes = [];
        this.nodeStructBuffer = new StructStorageGPUBuffer<T>(nodeStruct, this.maxNodeCount);
        for (let i = 0; i < this.maxNodeCount; i++) {
            this.nodes.push(new nodeStruct());
        }
        this.nodeStructBuffer.setStructArray(nodeStruct, this.nodes);
        this.nodeStructBuffer.apply();

        this.object3Ds = [];
        let bindObject3D: Object3D;
        let white: Color = new Color(1, 1, 1, 1);
        let black: Color = new Color(0, 0, 0, 0);
        let uvRect: Vector4 = new Vector4(0, 0, 0.1, 0.1);
        let uvSpeed: Vector4 = new Vector4(0, 0, 0, 0);
        let vec3Zero: Vector3 = new Vector3(0, 0, 0);
        for (let i = 0; i < this.maxNodeCount; i++) {
            if (standAloneMatrix) {
                const element = new Object3D();
                this.object3Ds.push(element);
                this.object3D.addChild(element);
                bindObject3D = element;
            } else {
                bindObject3D = this.object3D;
            }

            this.transformBuffer.setFloat("matrix_" + i, bindObject3D.transform.worldMatrix.index);
            this.transformBuffer.setFloat("texId_" + i, 0);
            this.transformBuffer.setFloat("texId2_" + i, 0);
            this.transformBuffer.setFloat("texId3_" + i, 0);

            this.transformBuffer.setFloat("fillRotation_" + i, 0);
            this.transformBuffer.setVector3("empty_" + i, vec3Zero);

            this.transformBuffer.setColor("baseColor_" + i, white);
            this.transformBuffer.setColor("lineColor_" + i, white);
            this.transformBuffer.setColor("emissiveColor_" + i, black);
            this.transformBuffer.setVector4("uvRect_" + i, uvRect);
            this.transformBuffer.setVector4("uvRect2_" + i, uvRect);
            this.transformBuffer.setVector4("uvSpeed_" + i, uvSpeed);
        }

        this.transformBuffer.apply();
        this.start = () => {
            for (const compute of this._onStartKernel) {
                compute.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
                compute.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
                compute.setStorageBuffer("drawBuffer", this.drawAtomicBuffer);
                compute.setStructStorageBuffer("nodeBuffer", this.nodeStructBuffer);
            }
            for (const compute of this._onChangeKernelGroup) {
                compute.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
                compute.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
                compute.setStorageBuffer("drawBuffer", this.drawAtomicBuffer);
                compute.setStructStorageBuffer("nodeBuffer", this.nodeStructBuffer);
            }
            for (const compute of this._onFrameKernelGroup) {
                compute.setStorageBuffer("globalUniform", GlobalBindGroup.getCameraGroup(this.transform.scene3D.view.camera).uniformGPUBuffer);
                compute.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
                compute.setStorageBuffer("drawBuffer", this.drawAtomicBuffer);
                compute.setStructStorageBuffer("nodeBuffer", this.nodeStructBuffer);
            }
        }
    }

    public setNodeStruct(index: number, shape: DynamicDrawStruct) {
        this.nodeStructBuffer.setStruct(this._nodeStruct, index, shape);
        this.nodes ||= [];
        this.nodes[index] = shape;
        this.nodeStructBuffer.apply();
    }

    public updateShape() {
        for (let i = 0; i < this.nodes.length; i++) {
            const shapeInfo = this.nodes[i];
            this.nodeStructBuffer.setStruct(this._nodeStruct, i, shapeInfo);
        }
        this.nodeStructBuffer.apply();
        this._needCompute = true;
    }

    public setTextureID(i: number, id: number) {
        this.transformBuffer.setFloat("texId_" + i, id);
        this._onBufferChange = true;
    }

    public setLineTextureID(i: number, id: number) {
        this.transformBuffer.setFloat("texId2_" + i, id);
        this._onBufferChange = true;
    }

    public setBaseColor(i: number, color: Color) {
        this.transformBuffer.setColor("baseColor_" + i, color);
        this._onBufferChange = true;
    }

    public setLineColor(index: number, color: Color) {
        this.transformBuffer.setColor("lineColor_" + index, color);
        this._onBufferChange = true;
    }

    public setEmissiveColor(i: number, color: Color) {
        this.transformBuffer.setColor("emissiveColor_" + i, color);
        this._onBufferChange = true;
    }

    public setFillRotation(i: number, radians: number) {
        this.transformBuffer.setFloat("fillRotation_" + i, radians);
        this._onBufferChange = true;
    }

    public setUVRect(i: number, v: Vector4) {
        this.transformBuffer.setVector4("uvRect_" + i, v);
        this._onBufferChange = true;
    }

    public setUVRect2(i: number, v: Vector4) {
        this.transformBuffer.setVector4("uvRect2_" + i, v);
        this._onBufferChange = true;
    }

    /**
     *
     * @param {number} i index
     * @param {Vector4} v {x:fill speed u, y: fill speed v, z:line speed u, w: line speed v}
     * @memberof DynamicFaceRenderer
     */
    public setUVSpeed(i: number, v: Vector4) {
        this.transformBuffer.setVector4("uvSpeed_" + i, v);
        this._onBufferChange = true;
    }

    public onUpdate(view?: View3D) {
        if (this._onBufferChange) {
            this._onBufferChange = false;
            this.transformBuffer.apply();
        }
    }

    public onCompute(view: View3D, command: GPUCommandEncoder): void {
        this.drawAtomicBuffer.apply();

        if (!this._initCompute) {
            this._initCompute = true;
            this.onStartCompute(view, command);
        }
        if (this._needCompute) {
            this._needCompute = false;
            this.onChangeCompute(view, command);
        }

        this.onFrameCompute(view, command);
    }

    protected onStartCompute(view: View3D, command: GPUCommandEncoder) {
        GPUContext.computeCommand(command, this._onStartKernel);
    }

    protected onChangeCompute(view: View3D, command: GPUCommandEncoder) {
        GPUContext.computeCommand(command, this._onChangeKernelGroup);
    }

    protected onFrameCompute(view: View3D, command: GPUCommandEncoder) {
        GPUContext.computeCommand(command, this._onFrameKernelGroup);
    }
}