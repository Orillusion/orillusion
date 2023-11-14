export let DDGIIrradiance_shader = /*wgsl*/`
#include "GenerayRandomDir"
#include "MathShader"
#include "IrradianceVolumeData_frag"
var<private> PI: f32 = 3.14159265359;

struct ProbeData{
  offsetX:f32,
  offsetY:f32,
  offsetZ:f32,
  frame:f32,
}

 struct Uniforms {
     matrix : array<mat4x4<f32>>
 };

struct RayProbeBuffer{
  WPosition: vec3<f32>,
  WNormal:vec3<f32>,
  WRadiance:vec4<f32>,
}

struct CacheHitData{
  color:vec4<f32>,
  depth:vec4<f32>,
}

//  struct RayInfo{
//   rays:array<vec4<f32>,4096>
//  }

@group(0) @binding(0) var<storage, read> probes : array<ProbeData>;
@group(0) @binding(1) var<storage, read_write> irradianceBuffer : array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> depthBuffer : array<vec4<f32>>;
@group(0) @binding(3) var<uniform> uniformData : IrradianceVolumeData ;
@group(0) @binding(4) var probeIrradianceMap : texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var probeDepthMap : texture_storage_2d<rgba16float, write>;
@group(0) @binding(6) var<storage, read_write> depthRaysBuffer : array<vec4<f32>>;

@group(1) @binding(0) var positionMap : texture_2d<f32>;
@group(1) @binding(1) var normalMap : texture_2d<f32>;
@group(1) @binding(2) var colorMap : texture_2d<f32>;

@group(2) @binding(0)
var<storage, read> models : Uniforms;

var<private> probeID: u32 ;
var<private> workgroup_idx: u32 ;
var<private> workgroup_idy: u32 ;
var<private> hysteresis: f32 = 0.98 ;
var<private> epsilon: f32 = 1e-6 ;
var<private> probeLocation:vec3<f32> = vec3<f32>(0.0);
var<private> energyConservation: f32 = 0.85 ;
var<private> resultIrradiance: vec4<f32> ;
var<private> resultDepth: vec4<f32> ;
var<private> RAYS_PER_PROBE: f32 = 144.0 ;
var<private> OCT_RT_SIZE: u32;
var<private> PROBE_OCT_RT_SIZE: u32;
var<private> OCT_SIDE_SIZE_u32: u32;
var<private> OCT_SIDE_SIZE_f32: f32;
var<private> OCT_RT_SIZE_f32: f32;
var<private> PROBE_SOURCESIZE: f32;
var<private> PROBEMAP_SOURCESIZE: f32;
var<private> quaternion:vec4<f32> = vec4<f32>(0.0, -0.7071067811865475, 0.7071067811865475, 0.0);
var<private> randomMatrix:mat4x4<f32>;

@compute @workgroup_size( 8 , 8 , 1 )
fn CsMain(@builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
{
   RAYS_PER_PROBE = f32(i32(uniformData.rayNumber));
   OCT_RT_SIZE = u32(uniformData.OctRTMaxSize);
   OCT_RT_SIZE_f32 = f32(uniformData.OctRTMaxSize);
   OCT_SIDE_SIZE_u32 = u32(uniformData.OctRTSideSize);
   OCT_SIDE_SIZE_f32 = f32(uniformData.OctRTSideSize);
   PROBE_SOURCESIZE = f32(uniformData.ProbeSize);
   PROBEMAP_SOURCESIZE = f32(uniformData.ProbeSourceTextureSize);
   hysteresis = uniformData.hysteresis;
    // probe index
    probeID = globalInvocation_id.z ;
    // pixel coord
    workgroup_idx = globalInvocation_id.x ;
    workgroup_idy = globalInvocation_id.y;

    probeLocation = calcProbePosition(probeID);

    resultIrradiance = vec4<f32>(0.0);
    resultDepth = vec4<f32>(0.0,0.0,0.0,0.0);

    var tdr = normalize(getCurrentDir());
    let orientationIndex = u32(uniformData.orientationIndex);
    randomMatrix = models.matrix[orientationIndex];

    var distancePprobeUV = getSampleProbeUV(tdr.xyz);
    var rayUv:vec2<i32> = vec2<i32>(distancePprobeUV.xy * f32(PROBEMAP_SOURCESIZE - 1.0));
    let rayHitPosition = textureLoad(positionMap, rayUv, 0).xyz ;
    
    for(var i:f32 = 0.0; i < RAYS_PER_PROBE ; i = i + 1.0 ){
      radianceProbeOnce(i, tdr);
    }

    if (resultIrradiance.w > epsilon) {
      var color = vec3<f32>(resultIrradiance.xyz/(2.0*resultIrradiance.w)) ;
      color = pow(color.rgb, vec3<f32>(1.0 / uniformData.ddgiGamma));
      resultIrradiance = vec4<f32>(color,1.0-hysteresis);
    }

    // if nonzero
    if (resultDepth.w > epsilon) {
      resultDepth = vec4<f32>(resultDepth.xyz/(2.0*resultDepth.w),1.0-hysteresis) ;
    }

   let pixelCoord = getWriteOctUVByID();

   var lerpDataResult:CacheHitData;

   lerpDataResult.color = resultIrradiance;

   lerpDataResult.depth = resultDepth;

   lerpDataResult = lerpHitData(lerpDataResult, pixelCoord);

   writeRayHitData(pixelCoord, lerpDataResult);

   storePixelAtCoord(probeIrradianceMap, pixelCoord , vec4<f32>(lerpDataResult.color.xyz, 1.0), true);

   storePixelAtCoord(probeDepthMap, pixelCoord , vec4<f32>(resultDepth.xy, 0.0, 1.0), false);
}

fn lerpHitData(data:CacheHitData, coord:vec2<i32>) -> CacheHitData{
   let frameIndex = probes[probeID].frame;
   var newData:CacheHitData = data;

   //if(frameIndex > 1.0){
      var oldData = readRayHitData(coord);
      newData.color = mix(oldData.color, newData.color, uniformData.lerpHysteresis);
      newData.depth = mix(oldData.depth, newData.depth, uniformData.lerpHysteresis);
   //}
   return newData;
}

fn square(v:vec3<f32>) -> vec3<f32>{
   var v3 = v;
   v3.x = v3.x * v3.x;
   v3.y = v3.y * v3.y;
   v3.z = v3.z * v3.z;
   return v3;
}

 fn testSample() ->vec4<f32>{
   var ux = f32(workgroup_idx) / OCT_SIDE_SIZE_f32;
   var uy = f32(workgroup_idy) / OCT_SIDE_SIZE_f32;
   var uv = vec2<f32>(ux,uy) * 2.0 - 1.0 ;
   var dir = octDecode(uv);
   var probeUV = getSampleProbeUV(dir.xyz);
   var rayProbeBuffer = getCurrentRayHitBuffer(probeUV);
   return rayProbeBuffer.WRadiance;
 }

 fn gridCoordToProbeIndex(grid:vec3<i32>) -> i32
 {
     return grid.x + grid.z * i32(uniformData.gridXCount) + grid.y * i32(uniformData.gridXCount * uniformData.gridZCount);
 }

fn storePixelAtCoord(texture:texture_storage_2d<rgba16float, write>, coord:vec2<i32>, color:vec4<f32>, isColor:bool){
   let sideCnt = i32(OCT_SIDE_SIZE_u32);
   let sideBorderCnt = sideCnt + 2;
   let indexXY = coord / sideCnt;
   let modeXY = coord % sideCnt;

   var newCoord = indexXY * sideBorderCnt + modeXY;
   textureStore(texture, newCoord + 1, color);

   var borderCoord = vec2<i32>(-1);
   //左右
   if(modeXY.x % (sideCnt - 1) == 0){
     borderCoord = modeXY;
     borderCoord.y = sideCnt - borderCoord.y;
     if(modeXY.x == sideCnt - 1){
       borderCoord.x = sideBorderCnt - 1;
     }
     borderCoord = indexXY * sideBorderCnt + borderCoord;
     textureStore(texture, borderCoord, color);
   }
   //上下
   if(modeXY.y % (sideCnt - 1) == 0){
     borderCoord = modeXY;
     borderCoord.x = sideCnt - borderCoord.x;
     if(modeXY.y == sideCnt - 1){
         borderCoord.y = sideBorderCnt - 1;
     }
     borderCoord = indexXY * sideBorderCnt + borderCoord;
     textureStore(texture, borderCoord, color);
   }
   //补角
   if(modeXY.x % (sideCnt - 1) == 0 && modeXY.y % (sideCnt - 1) == 0){
      var cornerCoord = modeXY;
      if(modeXY.x == 0){
         cornerCoord.x = sideBorderCnt - 1;
      }else{
         cornerCoord.x = 0;
      }
       if(modeXY.y == 0){
         cornerCoord.y = sideBorderCnt - 1;
      }else{
         cornerCoord.y = 0;
      }
      cornerCoord = indexXY * sideBorderCnt + cornerCoord;
      textureStore(texture, cornerCoord, color);
   }
}

fn calcProbePosition(id:u32) -> vec3<f32>{
   var probeLocation = vec3<f32>(0.0);
   var blockCount = u32(uniformData.gridXCount * uniformData.gridZCount) ;
   var grid = vec3<u32>(0u);
   grid.x = (id % blockCount) % u32(uniformData.gridXCount);
   grid.y = id / blockCount;
   grid.z = (id % blockCount) / u32(uniformData.gridXCount);
   probeLocation.x = f32(grid.x) * uniformData.ProbeSpace + uniformData.startX;
   probeLocation.y = f32(grid.y) * uniformData.ProbeSpace + uniformData.startY;
   probeLocation.z = f32(grid.z) * uniformData.ProbeSpace + uniformData.startZ;
   return probeLocation;
}

fn getWriteOctUVByID() -> vec2<i32>
{
   var blockCount = u32(uniformData.gridXCount * uniformData.gridZCount) ;
   var offsetX = (probeID % blockCount) % u32(uniformData.gridXCount) ;
   var offsetY = u32(uniformData.gridZCount - 1.0) - (probeID % blockCount) / u32(uniformData.gridXCount) ;
   var offsetZ = probeID / blockCount ;
   var pixelCoord = vec2<i32>(i32(workgroup_idx), i32(workgroup_idy));
   pixelCoord.x = pixelCoord.x + i32(offsetX * OCT_SIDE_SIZE_u32);
   pixelCoord.y = pixelCoord.y + i32(offsetY * OCT_SIDE_SIZE_u32 + offsetZ * u32(uniformData.gridZCount) * OCT_SIDE_SIZE_u32);

   pixelCoord = offsetByCol(pixelCoord, OCT_SIDE_SIZE_f32, OCT_RT_SIZE, vec3<f32>(uniformData.gridXCount, uniformData.gridYCount, uniformData.gridZCount));
   return pixelCoord;
}

fn offsetByCol(pixelCoord0:vec2<i32>, octSideSize:f32, mapHeight:u32, counts:vec3<f32>) -> vec2<i32>
{
 var pixelCoord = pixelCoord0;
 let blockSize:vec2<i32> = vec2<i32>(i32(octSideSize * counts.x),  i32(octSideSize * counts.z));
 let blockSizeYBorder:i32 = i32((octSideSize + 2.0) * counts.z);
 let blockMaxRowBorder:i32 = i32(mapHeight) / blockSizeYBorder;
 let pixelCountYMax:i32 = blockMaxRowBorder * i32(octSideSize * counts.z);
 let col:i32 = pixelCoord.y / pixelCountYMax;

 pixelCoord.x = col * i32(octSideSize * counts.x) + pixelCoord.x;
 pixelCoord.y = pixelCoord.y % pixelCountYMax;

 return pixelCoord;
}

fn radianceProbeOnce(rayID:f32, tdr:vec3<f32>){
   var texelDirection = sphericalFibonacci(rayID, RAYS_PER_PROBE ) ;
   var rayDirection = normalize( vec3<f32>((randomMatrix * vec4<f32>(texelDirection, 1.0)).xyz));
   var probeUV = getSampleProbeUV(rayDirection.xyz);
   var rayWriteUV = getWriteRayInfoUV();

   var rayProbeBuffer = getCurrentRayHitBuffer(probeUV);
   var rayHitLocation = rayProbeBuffer.WPosition + normalize(rayProbeBuffer.WNormal) * 0.01;

   var rayProbeDistance = length(probeLocation - rayHitLocation) ;
   // rayProbeDistance = min(uniformData.ProbeSpace * 4.0, rayProbeDistance) ;

   // if (dot(rayProbeBuffer.WNormal, rayProbeBuffer.WNormal) < epsilon) {
   //   rayProbeDistance = epsilon ;
   // }

   let rid = i32(probeID) * i32(RAYS_PER_PROBE) + i32(rayID) ;
   depthRaysBuffer[rid] = vec4<f32>(rayDirection.xyz,rayProbeDistance) ;

   // Detect misses and force depth
   var i_weight = max(0.0, dot(tdr,rayDirection) );
   var d_weight = pow(i_weight, uniformData.depthSharpness);
   
   if (i_weight >= epsilon) {
     //  var weightColor = pow(weight, (2.0 - uniformData.probeRoughness) * 2.0);
      resultIrradiance += vec4(rayProbeBuffer.WRadiance.rgb, i_weight );
     
   }
   if(d_weight>= epsilon){
       resultDepth += vec4(rayProbeDistance * d_weight, rayProbeDistance * rayProbeDistance * d_weight, 0.0 , i_weight);
   }
}

fn getCurrentRayHitBuffer(probeUV:vec2<f32>) -> RayProbeBuffer {
  var rayProbeBuffer : RayProbeBuffer ;
  var uv:vec2<i32> = vec2<i32>(probeUV.xy * f32(PROBEMAP_SOURCESIZE - 1.0));
  rayProbeBuffer.WPosition = textureLoad(positionMap, uv, 0).xyz ;
  rayProbeBuffer.WNormal = normalize(textureLoad(normalMap, uv, 0).xyz * 2.0 - 1.0);
  rayProbeBuffer.WRadiance = textureLoad(colorMap, uv, 0).xyzw * energyConservation;
  return rayProbeBuffer ;
}

fn getSampleProbeUV(dir0:vec3<f32>) -> vec2<f32> {
   var dir = applyQuaternion(dir0, quaternion);
   let faceId = dir_to_faceId(dir);
   var targetUV:vec2<f32> = convert_xyz_to_cube_uv(dir.x, dir.y, dir.z);
   targetUV.x = 1.0 - targetUV.x;
   let threshould = 0.5 / PROBE_SOURCESIZE;
   targetUV = clamp(targetUV, vec2<f32>(threshould), vec2<f32>(1.0 - threshould));

   targetUV.x = f32(faceId) + targetUV.x;

   let aspect:f32 = PROBE_SOURCESIZE / PROBEMAP_SOURCESIZE;
   targetUV = targetUV * aspect ;

   var fullCol = u32(PROBEMAP_SOURCESIZE) / u32(PROBE_SOURCESIZE);
   var offsetSampleUv = vec2<f32>( f32(probeID / fullCol) * 6.0 , f32(probeID % fullCol)) * aspect;
   return targetUV + offsetSampleUv;
}

fn getWriteRayInfoUV() -> vec2<i32> {
  var writeUV = vec2<i32>(i32(workgroup_idy),i32(probeID)) ;
  return writeUV ;
}

fn writeRayHitData( uv:vec2<i32> , data:CacheHitData){
  let index = uv.y * i32(OCT_RT_SIZE) + uv.x ;
  irradianceBuffer[index] = data.color ;
  depthBuffer[index] = data.depth ;
}

fn readRayHitData( uv:vec2<i32> ) -> CacheHitData{
  var data:CacheHitData;
  let index = uv.y * i32(OCT_RT_SIZE) + uv.x ;
  data.color = irradianceBuffer[index] ;
  data.depth = depthBuffer[index] ;
  return data;
}

fn getCurrentDir() -> vec3<f32> {
  var ux = f32(workgroup_idx) / OCT_SIDE_SIZE_f32;
  var uy = f32(workgroup_idy) / OCT_SIDE_SIZE_f32;
  var uv = vec2<f32>(ux,uy) * 2.0 - 1.0 ;
  var dir = octDecode(uv) ;
  return normalize(dir) ;
}


`