import { Texture } from '../../graphics/webGpu/core/texture/Texture';
import { webGPUContext } from '../../graphics/webGpu/Context3D';
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { GPUContext } from '../../renderJob/GPUContext';

/**
 * @internal
 * @group GFX
 */
export class TextureCubeStdCreator {

    private static createCube = /*wgsl*/ `

struct SettingUniform {
  faceIndex : i32,
  srcHeight : i32,
  dstWidth : i32,
  dstHeight : i32
};

@group(0) @binding(0) var<uniform> settingUniform : SettingUniform;
@group(0) @binding(1) var inputTex : texture_2d<f32>;
@group(0) @binding(2) var outTex : texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let coord = vec2<i32>(GlobalInvocationID.xy);
  
  let outTexSize = textureDimensions(outTex).xy;
  let outTexel = 1.0 / vec2<f32>(outTexSize - 1);
  
  let uv_0 = vec2<f32>(coord) * outTexel;
  var oc = samplePixel(settingUniform.faceIndex, uv_0);
  textureStore(outTex, coord, oc);
}

fn samplePixel(face:i32, uv01:vec2<f32>) -> vec4<f32> {
    let rectangle_v2_f32 = round(vec2<f32>(0.25, 0.33333) * vec2<f32>(textureDimensions(inputTex).xy));
    let rectangle = vec2<i32>(rectangle_v2_f32);
    
    var offsetIndex = vec2<i32>(0);
    if(face == 0){
        offsetIndex.x = 2;
        offsetIndex.y = 1;
    }else if(face == 1){
        offsetIndex.x = 0;
        offsetIndex.y = 1;
    }else if(face == 2){
        offsetIndex.x = 1;
        offsetIndex.y = 0;
    }else if(face == 3){
        offsetIndex.x = 1;
        offsetIndex.y = 2;
    }else if(face == 4){
        offsetIndex.x = 1;
        offsetIndex.y = 1;
    }else if(face == 5){
        offsetIndex.x = 3;
        offsetIndex.y = 1;
    }
    
    let coordOffset = rectangle * offsetIndex;
    let coordIndex = vec2<i32>(vec2<f32>(rectangle - 1) * uv01);
    var oc = textureLoad(inputTex, coordOffset + coordIndex, 0);
    return oc;
}
`;

    private static configBuffer: GPUBuffer = null;
    private static blurSettingBuffer: GPUBuffer = null;
    private static pipeline: GPUComputePipeline;

    static createFace(index: number, size: number, inTex: Texture, outTex: VirtualTexture): void {
        const device = webGPUContext.device;
        if (this.pipeline == null) {
            this.pipeline = device.createComputePipeline({
                layout: `auto`,
                compute: {
                    module: device.createShaderModule({
                        code: TextureCubeStdCreator.createCube,
                    }),
                    entryPoint: 'main',
                },
            });
        }
        const computePipeline = this.pipeline;

        //config
        const configStride = 4 * 4; //4 float
        this.configBuffer ||= device.createBuffer({
            size: configStride,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.configBuffer, 0, new Uint32Array([index, 0, 0, 0]));

        const quaternionSize = 4 * 6; ////xyzw * float

        //roughness
        this.blurSettingBuffer ||= device.createBuffer({
            size: configStride,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.blurSettingBuffer, 0, new Float32Array([0, 0, 0, 0]));

        //image
        let entries0 = [
            {
                binding: 0,
                resource: {
                    buffer: this.configBuffer,
                    size: 4 * 4,
                },
            },
            {
                binding: 1,
                resource: inTex.getGPUView(),
            },
            {
                binding: 2,
                resource: outTex.getGPUView(),
            }
        ];


        const computeBindGroup0 = device.createBindGroup({
            layout: computePipeline.getBindGroupLayout(0),
            entries: entries0,
        });

        const commandEncoder = GPUContext.beginCommandEncoder();
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, computeBindGroup0);
        computePass.dispatchWorkgroups(size / 8, size / 8);

        computePass.end();
        GPUContext.endCommandEncoder(commandEncoder);
    }
}
