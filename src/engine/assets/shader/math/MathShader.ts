/**
 * @internal
 */
export let MathShader = /* wgsl */ `
var<private> PI: f32 = 3.14159265359;


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

fn inverse( m:mat3x3<f32>) -> mat3x3<f32>{
  var a00 = m[0][0];
  var a01 = m[0][1];
  var a02 = m[0][2];
  var a10 = m[1][0];
  var a11 = m[1][1];
  var a12 = m[1][2];
  var a20 = m[2][0];
  var a21 = m[2][1];
  var a22 = m[2][2];

  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20;

  var det = a00 * b01 + a01 * b11 + a02 * b21 ;
  return mat3x3<f32>(
      vec3<f32>(b01/ det, (-a22 * a01 + a02 * a21)/ det, (a12 * a01 - a02 * a11)/ det),
      vec3<f32>(b11/ det, (a22 * a00 - a02 * a20)/ det, (-a12 * a00 + a02 * a10)/ det),
      vec3<f32>(b21/ det, (-a21 * a00 + a01 * a20)/ det, (a11 * a00 - a01 * a10)/ det)
  );
}

fn dir_to_faceId(pt:vec3<f32>) -> i32 {
    //**** nx px ny py nz pz
    var abs_x = abs(pt.x);
    var abs_y = abs(pt.y);
    var abs_z = abs(pt.z);
    var coord = max(max(abs_x, abs_y), abs_z);
    if(coord == -pt.x){  return 0;}
    if(coord == pt.x) { return 1;}

    if(coord == -pt.y){  return 2;}
    if(coord == pt.y) { return 3;}

    if(coord == -pt.z) { return 4;}
    return 5;
  }

  fn convert_xyz_to_cube_uv(x:f32, y:f32, z:f32 ) -> vec2<f32>
  {
    var dir = vec3<f32>(x, y, z);
    var absX = abs(dir.x);
    var absY = abs(dir.y);
    var absZ = abs(dir.z);

    var isXPositive = 0;
    if(dir.x > 0.0){isXPositive = 1;}
    var isYPositive = 0;
    if(dir.y > 0.0){isYPositive = 1;}
    var isZPositive = 0;
    if(dir.z > 0.0){isZPositive = 1;}

    var maxAxis:f32 = 0.0;
    var uc:f32 = 0.0;
    var vc:f32 = 0.0;

    // POSITIVE X
    if (isXPositive == 1 && absX >= absY && absX >= absZ) {
      // u (0 to 1) goes from +z to -z
      // v (0 to 1) goes from -y to +y
      maxAxis = absX;
      uc = -z;
      vc = y;
    }
    // NEGATIVE X
    if (isXPositive ==0 && absX >= absY && absX >= absZ) {
      // u (0 to 1) goes from -z to +z
      // v (0 to 1) goes from -y to +y
      maxAxis = absX;
      uc = z;
      vc = y;
    }
    // POSITIVE Y
    if (isYPositive==1 && absY >= absX && absY >= absZ) {
      // u (0 to 1) goes from -x to +x
      // v (0 to 1) goes from +z to -z
      maxAxis = absY;
      uc = x;
      vc = -z;
    }
    // NEGATIVE Y
    if (isYPositive ==0 && absY >= absX && absY >= absZ) {
      // u (0 to 1) goes from -x to +x
      // v (0 to 1) goes from -z to +z
      maxAxis = absY;
      uc = x;
      vc = z;
    }
    // POSITIVE Z
    if (isZPositive == 1&& absZ >= absX && absZ >= absY) {
      // u (0 to 1) goes from -x to +x
      // v (0 to 1) goes from -y to +y
      maxAxis = absZ;
      uc = x;
      vc = y;
    }
    // NEGATIVE Z
    if (isZPositive ==0 && absZ >= absX && absZ >= absY) {
      // u (0 to 1) goes from +x to -x
      // v (0 to 1) goes from -y to +y
      maxAxis = absZ;
      uc = -x;
      vc = y;
    }

    // Convert range from -1 to 1 to 0 to 1
    var u = 0.5f * (uc / maxAxis + 1.0f);
    var v = 0.5f * (vc / maxAxis + 1.0f);

    return vec2(u, v);
  }

    // Returns ±1
    fn signNotZero( v1:vec2<f32>) -> vec2<f32> {
        var v:vec2<f32> = v1;
        if(v.x >= 0.0){
            v.x = 1.0;
        }else{
            v.x = -1.0;
        }
        if(v.y >= 0.0){
            v.y = 1.0;
        }else{
            v.y= -1.0;
        }
        return v;
    }

    fn octEncode( v:vec3<f32> ) -> vec2<f32> {
        var l1norm = abs(v.x) + abs(v.y) + abs(v.z);
        var result = v.xy * (1.0 / l1norm);
        if (v.z < 0.0) {
            result = (1.0 - abs(result.yx)) * signNotZero(result.xy);
        }
        return result;
    }

    // Returns a unit vector. Argument o is an octahedral vector packed via octEncode,on the [-1, +1] square*/
    fn octDecode( o:vec2<f32> ) -> vec3<f32> {
        var v = vec3<f32>(o.x, o.y, 1.0 - abs(o.x) - abs(o.y));
        if (v.z < 0.0) {
            var tmp = (1.0 - abs(v.yx)) * signNotZero(v.xy);
            v.x = tmp.x;
            v.y = tmp.y;
        }
        return normalize(v);
    }

    fn Linear01Depth(z:f32,near:f32,far:f32)-> f32{
        let ZBufferZ = (-1.0+(far/near)) / far;
        let ZBufferW = near /far ;
        return 1.0 / (ZBufferZ * z + ZBufferW) ;
    }

    
    fn LinearizeDepth( depth:f32 , nearPlane:f32 , farPlane:f32 )-> f32 {
      var z = depth * 2.0 - 1.0;
      return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));
    }

    fn QuaternionToMatrix(q: vec4<f32>) -> mat4x4<f32> {
      // If q is guaranteed to be a unit quaternion, s will always
      // be 1.  In that case, this calculation can be optimized out.
      //float norm = GetNorm (q);
      //float s = (norm > 0.0) ? 2.0/norm : 0;

      var result: mat4x4<f32>;
  
      // Precalculate coordinate products
      let x = q.x * 2.0;
      let y = q.y * 2.0;
      let z = q.z * 2.0;
      let xx = q.x * x;
      let yy = q.y * y;
      let zz = q.z * z;
      let xy = q.x * y;
      let xz = q.x * z;
      let yz = q.y * z;
      let wx = q.w * x;
      let wy = q.w * y;
      let wz = q.w * z;
  
      // Calculate 3x3 matrix from orthonormal basis
      result[0][0] = 1.0 - (yy + zz);
      result[0][1] = xy + wz;
      result[0][2] = xz - wy;
      result[0][3] = 0.0;
  
      result[1][0] = xy - wz;
      result[1][1] = 1.0 - (xx + zz);
      result[1][2] = yz + wx;
      result[1][3] = 0.0;
  
      result[2][0] = xz + wy;
      result[2][1] = yz - wx;
      result[2][2] = 1.0 - (xx + yy);
      result[2][3] = 0.0;
  
      result[3][0] = 0.0;
      result[3][1] = 0.0;
      result[3][2] = 0.0;
      result[3][3] = 1.0;

      return result;
    }

    fn MakeScaleMatrix(scale: vec3<f32>) -> mat4x4<f32> {
        return mat4x4<f32>(
          scale.x, 0.0, 0.0, 0.0,
          0.0, scale.y, 0.0, 0.0,
          0.0, 0.0, scale.z, 0.0,
          0.0, 0.0, 0.0, 1.0,
        );
    }

    fn MakeRotationMatrix(rotationQuaternion: vec4<f32>) -> mat4x4<f32> {
        return QuaternionToMatrix(rotationQuaternion);
    }

    fn MakeTranslationMatrix(translation: vec3<f32>) -> mat4x4<f32> {
        return mat4x4<f32>(
          1.0, 0.0, 0.0, 0.0,
          0.0, 1.0, 0.0, 0.0,
          0.0, 0.0, 1.0, 0.0,
          translation.x, translation.y, translation.z, 1.0,
        );
    }

    fn MakeMatrix4x4(scale: vec3<f32>, rotationQuaternion: vec4<f32>, translation: vec3<f32>) -> mat4x4<f32> {
        var scaleMat: mat4x4<f32> = MakeScaleMatrix(scale);
        var rotationMat: mat4x4<f32> = MakeRotationMatrix(rotationQuaternion);
        var translationMat: mat4x4<f32> = MakeTranslationMatrix(translation);
        return translationMat * scaleMat * rotationMat;
    }

    fn mixMatrix4x4(a: mat4x4<f32>, b: mat4x4<f32>, t:f32) -> mat4x4<f32> {
      return a * (1.0 - t) + b * t;
      // return mat4x4<f32>(
      //   mix(a[0], b[0], t),
      //   mix(a[1], b[1], t),
      //   mix(a[2], b[2], t),
      //   mix(a[3], b[3], t)
      // );
    }

    fn decodeDepth( color:vec4<f32> ) -> f32{
      var depth = 0.0 ;
      const bitShifts = vec4<f32>(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0); 
      depth = dot(color, bitShifts);
      return depth;
    }

    fn encodeDepth( depth:f32 ) -> vec4<f32>{
      const bitSh  = vec4<f32>(256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);
      const bitMsk = vec4<f32>(0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0);
      var comp:vec4<f32>;
      comp  = depth * bitSh;
      comp  = fract(comp);
      comp -= comp.xxyz * bitMsk;
      return comp;
    }
`;
