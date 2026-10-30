import { StorageGPUBuffer } from '../../../gfx/graphics/webGpu/core/buffer/StorageGPUBuffer';
import { UniformGPUBuffer } from '../../../gfx/graphics/webGpu/core/buffer/UniformGPUBuffer';
import { MorphTarget_shader } from '../../../components/anim/morphAnim/MorphTarget_shader';
import { ComputeShader } from '../../../gfx/graphics/webGpu/shader/ComputeShader';
import { RenderShaderPass } from '../../../gfx/graphics/webGpu/shader/RenderShaderPass';
import { GeometryBase } from '../../../core/geometry/GeometryBase';
import { VertexAttributeData } from '../../../core/geometry/VertexAttributeData';
import { View3D } from '../../../core/View3D';

type MorphTargetCollectData = {
    mtCount: number;
    vCount: number;
    mergedPos: Float32Array;
    mergedNormal: Float32Array;
}

class MorphAttrDataGroup {
    source: Float32Array;
    input: StorageGPUBuffer;
    output: StorageGPUBuffer;

    reset(value: Float32Array): void {
        this.input && this.input.destroy();
        this.output && this.output.destroy();
        this.input = this.output = null;
        this.source = value;
    }

    public apply(vertexCount: number): void {
        if (this.source) {
            if (!this.input) {
                let usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
                this.input = new StorageGPUBuffer(this.source.length, usage, this.source);
                this.input.apply();
            }

            if (!this.output) {
                let usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
                this.output = new StorageGPUBuffer(vertexCount * 3, usage);
                this.output.apply();
            }
        }

    }
}

/**
 * GPU-side morph-target (blend-shape) state for a single geometry. Merges
 * per-target position/normal deltas into storage buffers and runs a compute
 * shader each frame to accumulate weighted deltas, then feeds the result
 * into the render shader.
 * @group Animation
 */
export class MorphTargetData {
    /** Whether morph-target processing is active. */
    public enable: boolean;
    /** When true, target deltas are applied relatively (added on top of the base). */
    public morphTargetsRelative: boolean;
    /** Maximum number of morph targets supported per geometry. */
    public readonly MaxMorphTargetCount: number = 64;

    protected _computeConfigArray: Float32Array;
    protected _computeConfigBuffer: UniformGPUBuffer;
    protected _morphInfluenceArray: Float32Array;
    protected _morphInfluenceBuffer: StorageGPUBuffer;
    protected _positionAttrDataGroup: MorphAttrDataGroup;
    protected _normalAttrDataGroup: MorphAttrDataGroup;

    private _isInfluenceDirty: boolean;

    protected _morphTargetCount: number;
    protected _totalVertexCount: number;

    protected _computeShader: ComputeShader;
    protected _computeShaders: ComputeShader[];
    protected _computeWorkGroupXY: number = 1;

    protected _collectMorphTargetData: MorphTargetCollectData;

    private _blendTarget: { [key: string]: any }


    constructor() {
        this._isInfluenceDirty = true;
        this.generateGPUBuffer();
        this._positionAttrDataGroup = new MorphAttrDataGroup();
        this._normalAttrDataGroup = new MorphAttrDataGroup();
    }

    /** Collect a geometry's morph targets and build the compute shader + buffers. */
    public initMorphTarget(geometry: GeometryBase): void {
        this._collectMorphTargetData = this.collectMorphTargetList(geometry);

        this._computeShader && this._computeShader.destroy();
        let code = MorphTarget_shader.CsMain;
        this._computeShader = new ComputeShader(code);
        if (this._collectMorphTargetData.mergedNormal) {
            this._computeShader.setDefine('USE_MORPHNORMALS', true);
        } else {
            this._computeShader.deleteDefine('USE_MORPHNORMALS');
        }
        this._computeShaders = [this._computeShader];

        this._isInfluenceDirty = true;
        this._morphTargetCount = this._collectMorphTargetData.mtCount;
        this._totalVertexCount = this._collectMorphTargetData.vCount;
        this._morphInfluenceArray.fill(0);
        this._computeWorkGroupXY = this.calcWorkGroup(this._totalVertexCount);
        //
        this._positionAttrDataGroup.reset(this._collectMorphTargetData.mergedPos);
        this._normalAttrDataGroup.reset(this._collectMorphTargetData.mergedNormal);
    }

    /** Bind the morph-target config and output buffers onto a render shader pass. */
    public applyRenderShader(renderShader: RenderShaderPass) {
        this.uploadMorphTargetBuffer();
        this.uploadConfigGBuffer();
        //
        renderShader.setUniformBuffer('morphTargetConfig', this._computeConfigBuffer);
        renderShader.setStorageBuffer('morphTargetOpPositions', this._positionAttrDataGroup.output);

        if (this._collectMorphTargetData.mergedNormal) {
            renderShader.setStorageBuffer('morphTargetOpNormals', this._normalAttrDataGroup.output);
        }
    }

    /** Dispatch the compute shader that accumulates weighted morph deltas. */
    public computeMorphTarget(view: View3D, command: GPUCommandEncoder): void {
        this.uploadConfigGBuffer();
        this.uploadMorphTargetBuffer();

        this._computeShader.setUniformBuffer('morphTargetConfig', this._computeConfigBuffer);
        this._computeShader.setStorageBuffer('morphTargetInfluence', this._morphInfluenceBuffer);
        this._computeShader.setStorageBuffer('morphTargetPositions', this._positionAttrDataGroup.input);
        this._computeShader.setStorageBuffer('morphTargetOpPositions', this._positionAttrDataGroup.output);
        if (this._collectMorphTargetData.mergedNormal) {
            this._computeShader.setStorageBuffer('morphTargetNormals', this._normalAttrDataGroup.input);
            this._computeShader.setStorageBuffer('morphTargetOpNormals', this._normalAttrDataGroup.output);
        }
        this._computeShader.workerSizeX = this._computeWorkGroupXY;
        this._computeShader.workerSizeY = this._computeWorkGroupXY;
        this._computeShader.workerSizeZ = 1;

        view.engine3D.context3D.gpuContext.computeCommand(command, this._computeShaders);
    }

    /** Set the influence weight of the morph target at `index`. */
    public updateInfluence(index: number, value: number) {
        this._isInfluenceDirty = true;
        this._morphInfluenceArray[index] = value;
    }

    /** Current influence weight of each morph target (read-only view; use `updateInfluence` to change). */
    public get influences(): Float32Array {
        return this._morphInfluenceArray;
    }

    /** Number of morph targets of the current geometry. */
    public get morphTargetCount(): number {
        return this._morphTargetCount;
    }

    /**
     * Weight of the base position in the blend, as the shader applies it:
     * 1 for relative targets, `1 - Σ influences` for absolute ones.
     */
    public get baseInfluence(): number {
        if (this.morphTargetsRelative) return 1;
        let sum = 0;
        for (let i = 0; i < this._morphTargetCount; i++) sum += this._morphInfluenceArray[i];
        return 1 - sum;
    }

    /** Map of blend-shape name to its influence-setter function. */
    public get blendShape() {
        return this._blendTarget;
    }

    private collectMorphTargetList(geometry: GeometryBase): MorphTargetCollectData {
        let posAttrList = this.collectAttribute('a_morphPositions_', geometry);
        let morphTargetCount = posAttrList.length;
        let vertexCount: number = posAttrList[0].data.length / 3;

        this._blendTarget = {};
        if (geometry.blendShapeData) {
            for (let i = 0; i < geometry.blendShapeData.shapeIndexs.length; i++) {
                let index = geometry.blendShapeData.shapeIndexs[i];
                let shapeNames = geometry.blendShapeData.shapeNames[i].split(".");
                let shapeName = shapeNames[shapeNames.length - 1];
                this._blendTarget[shapeName] = (value) => this.updateInfluence(index, value);
            }
        }

        //position
        let posArray: Float32Array = new Float32Array(vertexCount * morphTargetCount * 3);
        {
            let offset: number = 0;
            for (let i = 0; i < morphTargetCount; i++) {
                let item = posAttrList[i];
                posArray.set(item.data, offset);
                offset += item.data.length;
            }
        }

        //normal
        let normalAttrList = this.collectAttribute('a_morphNormals_', geometry);
        let normalArray: Float32Array;
        if (normalAttrList && normalAttrList.length > 0) {
            let offset: number = 0;
            normalArray = new Float32Array(vertexCount * morphTargetCount * 3);
            for (let i = 0; i < morphTargetCount; i++) {
                let item = normalAttrList[i];
                normalArray.set(item.data, offset);
                offset += item.data.length;
            }
        }

        return { mtCount: morphTargetCount, vCount: vertexCount, mergedPos: posArray, mergedNormal: normalArray };
    }

    private collectAttribute(attrKey: string, geometry: GeometryBase): VertexAttributeData[] {
        let list = [];
        for (let i = 0; i < this.MaxMorphTargetCount; i++) {
            let morphKey = attrKey + i;
            let item = geometry.getAttribute(morphKey);
            if (!item) break;
            else list[i] = item;

        }
        return list;
    }

    private uploadConfigGBuffer(): void {
        if (this._isInfluenceDirty) {
            let sumInfluence = 0;
            for (let i = 0; i < this._morphTargetCount; i++) {
                sumInfluence += this._morphInfluenceArray[i];
            }
            this._morphInfluenceBuffer.setFloat32Array('data', this._morphInfluenceArray);
            this._morphInfluenceBuffer.apply();
            // sumInfluence = Math.max(sumInfluence, 0);
            // sumInfluence = Math.min(sumInfluence, 1);
            this._computeConfigArray[0] = this.morphTargetsRelative ? 1 : 1 - sumInfluence;
            this._computeConfigArray[1] = this._morphTargetCount;
            this._computeConfigArray[2] = this._totalVertexCount;
            this._computeConfigArray[3] = this._computeWorkGroupXY;
            this._computeConfigBuffer.setFloat32Array('data', this._computeConfigArray);
            this._computeConfigBuffer.apply();
            this._isInfluenceDirty = false;
        }
    }

    private calcWorkGroup(count: number): number {
        let groupXY = Math.ceil(Math.sqrt(count));
        let log2 = Math.ceil(Math.log2(groupXY));
        groupXY = Math.pow(2, log2);
        return groupXY;
    }


    protected uploadMorphTargetBuffer(): void {
        if (!this._positionAttrDataGroup.output) {
            this._positionAttrDataGroup.apply(this._totalVertexCount);
        }
        if (!this._normalAttrDataGroup.output) {
            this._normalAttrDataGroup.apply(this._totalVertexCount);
        }
    }

    protected generateGPUBuffer() {
        //config
        this._computeConfigArray = new Float32Array(4);
        this._computeConfigBuffer = new UniformGPUBuffer(4);

        //influence array
        this._morphInfluenceArray = new Float32Array(this.MaxMorphTargetCount);
        let usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
        this._morphInfluenceBuffer = new StorageGPUBuffer(this.MaxMorphTargetCount, usage);
    }
}
