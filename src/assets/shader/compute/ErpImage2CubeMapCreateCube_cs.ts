export let ErpImage2CubeMapCreateCube_cs: string = /*wgsl*/ `
  struct ImageSize {
    srcWidth : i32,
    srcHeight : i32,
    dstWidth : i32,
    dstHeight : i32
  };

  @group(0) @binding(0) var<uniform> size : ImageSize;
  @group(0) @binding(1) var<storage,read_write> faceRotation: array<vec4<f32>>;
  @group(0) @binding(2) var inputTexSampler : sampler;
  @group(0) @binding(3) var inputTex : texture_2d<f32>;

  @group(1) @binding(0) var outputBuffer0 : texture_storage_2d_array<rgba16float, write>;

  fn SampleSphericalMap(v: vec3<f32>) -> vec2<f32> {
      var uv:vec2<f32> = vec2<f32>(atan2(v.z, v.x), asin(v.y));
      //uv = (uv * (vec2<f32>(0.1590999960899353, 0.3183000087738037) + vec2<f32>(0.0010000000474974513)));
      uv = uv * vec2<f32>(0.1590999960899353, 0.3183000087738037);
      uv = uv + vec2<f32>(0.5);
      uv = clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0));
      return uv;
  }


  fn applyQuaternion(position:vec3<f32>, q:vec4<f32>) -> vec3<f32>{
      let x:f32 = position.x;
      let y:f32 = position.y;
      let z:f32 = position.z;

      let qx:f32 = q.x;
      let qy:f32 = q.y;
      let qz:f32 = q.z;
      let qw:f32 = q.w;

      let ix:f32 = qw * x + qy * z - qz * y;
      let iy:f32 = qw * y + qz * x - qx * z;
      let iz:f32 = qw * z + qx * y - qy * x;
      let iw:f32 = -qx * x - qy * y - qz * z;

      var ret: vec3<f32>;
      ret.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
      ret.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
      ret.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

      return ret;
  }

  fn convertIdToDir3(uv_i32:vec2<i32>, quaternion:vec4<f32>) -> vec3<f32>{
      var uv_f32:vec2<f32> = vec2<f32>(uv_i32.xy);
      var halfSize:f32 = f32(size.dstWidth / 2);
      var worldDirection:vec3<f32> = vec3<f32>(uv_f32.x - halfSize, uv_f32.y - halfSize, -halfSize);
      worldDirection = normalize(worldDirection);
      worldDirection = applyQuaternion(worldDirection, quaternion);
      return worldDirection;
  }

  @compute @workgroup_size(8, 8, 1)
  fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let coord = vec2<i32>(GlobalInvocationID.xy);
    let quaternion = faceRotation[GlobalInvocationID.z];
    var worldDirection:vec3<f32> = convertIdToDir3(coord, quaternion);
    let uv_f32:vec2<f32> = SampleSphericalMap(worldDirection);
    let oc = textureSampleLevel(inputTex, inputTexSampler, uv_f32 , 0.0);
    textureStore(outputBuffer0, coord, i32(GlobalInvocationID.z), oc);
  }
`

