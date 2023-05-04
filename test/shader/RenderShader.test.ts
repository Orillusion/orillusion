import { test, expect, end, delay } from '../util'
import { Engine3D, RenderShader, ShaderLib } from '@orillusion/core';

const a = Engine3D;

await test('RenderShader', async () => {
    const shaderCode = /* wgsl */ `

        struct VertexInput {
            @location(0) position: vec3<f32>,
            @location(1) normal: vec3<f32>,
            @location(2) uv: vec2<f32>,
            @location(3) color: vec4<f32>,
        };

        struct FragmentInput {
            @builtin(position) position: vec4<f32>,
            @location(0) uv: vec4<f32>,
            @location(1) color: vec4<f32>,
        };

        struct GlobalUniform {
            projMatrix: mat4x4<f32>,
            viewMatrix: mat4x4<f32>,
            modelMatrix: mat4x4<f32>,
        };

        @group(0) @binding(0) var<uniform> global: GlobalUniform;

        @vertex
        fn vsMain(in: VertexInput) -> FragmentInput {
            let mvpMatrix = global.projMatrix * global.viewMatrix * global.modelMatrix;
            var out: FragmentInput;
            out.position = mvpMatrix * vec4<f32>(in.position.xyz, 1.0);
            out.uv = in.uv;
            out.color = in.color;
            return out;
        }

        struct FragmentOutput {
            @location(0) color: vec4<f32>,
        };

        @group(1) @binding(0) var baseMapSampler: sampler;
        @group(1) @binding(1) var baseMap: texture_2d<f32>;

        @fragment
        fn fsMain(in: FragmentInput) -> FragmentOutput {
            var out: FragmentOutput;
            out.color = textureSampleLevel(baseMap, baseMapSampler, in.uv, 0.0) * in.color;
            return out;
        }
    `;
    ShaderLib.register('TestShader', shaderCode);

    expect(ShaderLib.getShader('TestShader')).toEqual(shaderCode);

    let renderShader = new RenderShader('TestShader', 'TestShader');
    renderShader.setShaderEntry('vsMain', 'fsMain');

    expect(renderShader.vsEntryPoint).toEqual('vsMain');
    expect(renderShader.fsEntryPoint).toEqual('fsMain');
})

setTimeout(end, 500)
