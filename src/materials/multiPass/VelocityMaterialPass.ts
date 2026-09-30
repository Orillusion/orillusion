import { Context3D } from '../../gfx/graphics/webGpu/Context3D';
import { GlobalBindGroup } from '../../gfx/graphics/webGpu/core/bindGroups/GlobalBindGroup';
import { UniformGPUBuffer } from '../../gfx/graphics/webGpu/core/buffer/UniformGPUBuffer';
import { RenderShaderPass } from '../../gfx/graphics/webGpu/shader/RenderShaderPass';
import { GPUCompareFunction } from '../../gfx/graphics/webGpu/WebGPUConst';
import { PassType } from '../../gfx/renderJob/passRenderer/state/PassType';

/**
 * @internal
 * Companion pass that writes per-object screen-space velocity. Shares one
 * `velocityData` uniform (previous view-projection) per Context3D and reads
 * the previous-frame model matrices kept by MatrixBindGroup.
 */
export class VelocityMaterialPass extends RenderShaderPass {
    private static readonly _uniforms: WeakMap<Context3D, UniformGPUBuffer> = new WeakMap();

    /** The shared `prevViewProj` uniform of a context (created on first use). */
    public static velocityUniform(ctx: Context3D): UniformGPUBuffer {
        let u = VelocityMaterialPass._uniforms.get(ctx);
        if (!u) {
            u = new UniformGPUBuffer(16);
            VelocityMaterialPass._uniforms.set(ctx, u);
        }
        return u;
    }

    constructor() {
        super(`VelocityPass_shader`, `VelocityPass_shader`);
        this.passType = PassType.VELOCITY;
        this.setShaderEntry(`vert`, `frag`);
        this.useRz = false;
        const state = this.shaderState;
        state.receiveEnv = false;
        state.depthWriteEnabled = true;
        state.depthCompare = GPUCompareFunction.less;
    }

    /** Bind the shared previous-matrix buffer and uniform for `ctx`. */
    public bindSharedBuffers(ctx: Context3D) {
        const group = GlobalBindGroup.getModelMatrixBindGroup(ctx);
        this.setStorageBuffer(`prevModels`, group.ensurePrevious() as any);
        this.setUniformBuffer(`velocityData`, VelocityMaterialPass.velocityUniform(ctx));
    }
}
