import { Matrix4 } from '../../../../../math/Matrix4';
import { UUID } from '../../../../../util/Global';
import { bindCtx, Context3D } from '../../Context3D';
import { MatrixGPUBuffer } from '../buffer/MatrixGPUBuffer';
/**
 * @internal
 * @group GFX
 */
export class MatrixBindGroup {
    public uuid: string;
    public index: number;
    public usage: number;
    public groupBufferSize: number;
    public matrixBufferDst: MatrixGPUBuffer;
    /** Previous frame's copy of {@link matrixBufferDst}, kept while
     *  {@link keepPrevious} is true (per-object motion vectors). */
    public matrixBufferPrev: MatrixGPUBuffer | null = null;
    /** Set by VelocityMaterialPass.bindSharedBuffers; snapshots the model
     *  matrices every frame before the new upload. */
    public keepPrevious: boolean = false;
    private _ctx: Context3D;
    constructor(ctx: Context3D) {
        this.uuid = UUID();
        this.groupBufferSize = 0;
        this.usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
        this.cacheWorldMatrix(ctx);
    }


    private cacheWorldMatrix(ctx: Context3D) {
        this.groupBufferSize = Matrix4.maxCount * Matrix4.blockBytes;
        // COPY_SRC so the previous-frame snapshot can be taken with a GPU copy.
        this.matrixBufferDst = new MatrixGPUBuffer(this.groupBufferSize / 4 + Matrix4.maxCount * 8, GPUBufferUsage.COPY_SRC);
        bindCtx(this.matrixBufferDst, ctx);
        this._ctx = ctx;
        this.matrixBufferDst.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE
        this.matrixBufferDst.buffer.label = this.groupBufferSize.toString();
    }

    /** Create the previous-frame buffer (idempotent) and start snapshotting into it. */
    public ensurePrevious(): MatrixGPUBuffer {
        if (!this.matrixBufferPrev) {
            this.matrixBufferPrev = new MatrixGPUBuffer(this.groupBufferSize / 4 + Matrix4.maxCount * 8);
            bindCtx(this.matrixBufferPrev, this._ctx);
            this.matrixBufferPrev.visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE;
            this.matrixBufferPrev.buffer.label = 'prevModelMatrices';
        }
        this.keepPrevious = true;
        return this.matrixBufferPrev;
    }

    /** Copy the current GPU matrices (still last frame's) into the previous-frame buffer. */
    private snapshotPrevious(len: number) {
        const ctx = this._ctx;
        if (!ctx) return;
        this.ensurePrevious();
        const bytes = Math.min(len * 4, this.matrixBufferPrev.buffer.size);
        if (bytes <= 0) return;
        const encoder = ctx.device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.matrixBufferDst.buffer, 0, this.matrixBufferPrev.buffer, 0, bytes);
        ctx.device.queue.submit([encoder.finish()]);
    }

    writeBuffer(len: number) {
        // Take the snapshot BEFORE this frame's upload lands, so `prev`
        // holds exactly what the last frame rendered with.
        if (this.keepPrevious) this.snapshotPrevious(len);
        const ctx = this.matrixBufferDst._boundCtx;
        const setting = ctx?.engine?.setting;
        if (setting?.doublePrecision) {
            Matrix4.dynamicMatrixBytes_32bit.set(Matrix4.dynamicMatrixBytes);
            this.matrixBufferDst.mapAsyncWrite(Matrix4.dynamicMatrixBytes_32bit, len);
        } else {
            this.matrixBufferDst.mapAsyncWrite(Matrix4.dynamicMatrixBytes, len);
        }

        if (setting?.useRTE) {
            if (ctx) {
                ctx.device.queue.writeBuffer(this.matrixBufferDst.buffer, Matrix4.maxCount * (16 * 4), Matrix4.matrixWorldPositionHLDatas as unknown as BufferSource);
            }
        }
    }

}
