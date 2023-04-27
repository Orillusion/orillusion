import { Texture } from '../../core/texture/Texture';
import { UniformNode } from '../../core/uniforms/UniformNode';
import { ConstValue } from './ConstValue';
import { DefineValue } from './DefineValue';
import { ShaderReflection } from './ShaderReflectionInfo';
import { ShaderState } from './ShaderState';
/**
 * @internal
 */
export type ShaderUniform = { [uniName: string]: UniformNode };

/**
 * @internal
 */
export type ShaderConst = { [uniName: string]: ConstValue };

/**
 * @internal
 */
export type ShaderDefines = { [uniName: string]: boolean | number | string };

/**
 * @internal
 */
export type ShaderValue = {
    vs?: string;
    fs?: string;
    compute?: string;

    vs_Source?: string;
    fs_Source?: string;
    compute_Source?: string;

    vs_shader?: string;
    fs_shader?: string;

    vsModule?: GPUShaderModule;
    fsModule?: GPUShaderModule;
    csModule?: GPUShaderModule;

    shaderVariant?: string;

    uniforms?: ShaderUniform;
    constValues?: ShaderConst;
    defines?: ShaderDefines;
    shaderState?: ShaderState;
    shaderReflection?: ShaderReflection;

    // input_textures?:Texture[],
    // output_textures?: Iterable<GPUColorTargetState>;
};
