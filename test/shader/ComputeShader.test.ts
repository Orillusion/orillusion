import { test, expect, end, delay } from '../util'
import { ComputeShader, Engine3D, UniformGPUBuffer } from '@orillusion/core';

await test('ComputeShader', async () => {

    await Engine3D.init();

    let gaussianBlurShader = new ComputeShader(/* wgsl */ `
        struct GaussianBlurArgs {
            radius: f32,
            retain: vec3<f32>,
        };

        @group(0) @binding(0) var<uniform> args: GaussianBlurArgs;
        @group(0) @binding(1) var colorMap: texture_2d<f32>;
        @group(0) @binding(2) var resultTex: texture_storage_2d<rgba16float, write>;

        @compute @workgroup_size(8, 8)
        fn CsMain( @builtin(global_invocation_id) globalInvocation_id: vec3<u32>) {
            var pixelCoord = vec2<i32>(globalInvocation_id.xy);

            var value = vec4<f32>(0.0);
            var count = 0.0;
            let radius = i32(args.radius);
            for (var i = -radius; i < radius; i += 1) {
            for (var j = -radius; j < radius; j += 1) {
                var offset = vec2<i32>(i, j);
                value += textureLoad(colorMap, pixelCoord + offset, 0);
                count += 1.0;
            }
            }

            let result = value / count;
            textureStore(resultTex, pixelCoord, result);
        }
    `);

    let gaussianBlurArgs = new UniformGPUBuffer(28);
    gaussianBlurArgs.setFloat('radius', 2);
    gaussianBlurArgs.apply();

    gaussianBlurShader.setUniformBuffer('args', gaussianBlurArgs);

    gaussianBlurShader.workerSizeX = 1;
    gaussianBlurShader.workerSizeY = 1;
    gaussianBlurShader.workerSizeZ = 1;
})

setTimeout(end, 500)
