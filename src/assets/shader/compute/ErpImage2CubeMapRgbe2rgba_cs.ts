export let ErpImage2CubeMapRgbe2rgba_cs: string = /*wgsl*/ `
  struct ImageSize {
    srcWidth : i32,
    srcHeight : i32,
    dstWidth : i32,
    dstHeight : i32
  };

  @group(0) @binding(0) var<uniform> size : ImageSize;
  @group(0) @binding(1) var<storage, read> tex_in: array<vec4<f32>>;
  @group(0) @binding(2) var outputBuffer : texture_storage_2d<rgba16float, write>;

  @compute @workgroup_size(8, 8, 1)
  fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let fragCoord = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
    var oc:vec4<f32> = tex_in[fragCoord.y * size.srcWidth + fragCoord.x] / 256.0;
    var e = pow(2.0, oc.w * 255.0 - 128.0);
    oc = oc * e;
    oc = scaleByThreshold(oc, 40.0);
    textureStore(outputBuffer, fragCoord , vec4<f32>(oc.xyz, 1.0) );
  }

  fn scaleByThreshold(color:vec4<f32>, threshold:f32) -> vec4<f32>{
    var oc = color;
    let brightness = length(vec3<f32>(oc.xyz));
    var scale = brightness / threshold;
    if(scale > 1.0){
        scale = 1.0 / pow(scale, 0.7);
        oc = oc * scale;
    }
    oc.a = 1.0;
    return oc;
  }
`

