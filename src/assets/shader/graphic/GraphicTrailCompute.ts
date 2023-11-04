export let graphicTrailCompute: string = /*wgsl*/`
#include "GlobalUniform"

struct VertexInfo{
    // position:vec3f,
    px:f32,
    py:f32,
    pz:f32,
    nx:f32,
    ny:f32,
    nz:f32,
    uv_x:f32,
    uv_y:f32,
    uv2_x:f32,
    uv2_y:f32,
    index:f32,
    index2:f32
}

struct TrailInfo{
    index : f32 ,
    segment : f32 ,
    visible : f32 ,
    width: f32,
    uv: vec4f,
    uvSpeed: vec2f,
    smoothLine: f32,
    useBillboard: f32,
    ids:array<f32,128>
}

@group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
@group(0) @binding(2) var<storage, read> trailBuffer : array<TrailInfo>;
@group(0) @binding(3) var<storage, read> models : array<mat4x4<f32>>;

@compute @workgroup_size(1)
fn CsMain(@builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32>){
    let indexTrail = workgroup_id.x ;
    let trailInfo = trailBuffer[indexTrail];
    if(trailInfo.visible > 0.0){
        let segmentLength = u32(trailInfo.segment + 1.0);
        let first = indexTrail * segmentLength ;
        let len = first + segmentLength ;
        let time = globalUniform.frame * 0.001;
        for (var i:u32 = first ; i < len ; i += 1u) {
            let i1 = i * 2u + 0u;
            let i2 = i * 2u + 1u;
    
            let mat = models[i32(trailInfo.ids[i - first ])] ;
            let right = transformVector(mat,vec3f(1.0,0.0,0.0));
            let worldPos = (mat * vec4f(0.0,0.0,0.0,1.0)).xyz ;
            let leftPos = worldPos - right.xyz * trailInfo.width ;
            let rightPos = worldPos + right.xyz * trailInfo.width ;
    
            vertexBuffer[i1].px = leftPos.x ;
            vertexBuffer[i1].py = leftPos.y ;
            vertexBuffer[i1].pz = leftPos.z ;
    
            vertexBuffer[i2].px = rightPos.x ;
            vertexBuffer[i2].py = rightPos.y ;
            vertexBuffer[i2].pz = rightPos.z ;
    
            vertexBuffer[i1].uv_x = (0.0 * trailInfo.uv.z + trailInfo.uv.x) + time * trailInfo.uvSpeed.x ;
            vertexBuffer[i2].uv_x = (1.0 * trailInfo.uv.z + trailInfo.uv.x) + time * trailInfo.uvSpeed.x ;
    
            let v = (1.0 - f32(i-first) / trailInfo.segment) * trailInfo.uv.w + trailInfo.uv.y;
            vertexBuffer[i1].uv_y = v + time * trailInfo.uvSpeed.y ;
            vertexBuffer[i2].uv_y = v + time * trailInfo.uvSpeed.y ;
        }
    }
}

fn transformVector(m:mat4x4f , v: vec3f ) -> vec3f {
    let x2 = v.x * m[0][0] + v.y * m[0][1] + v.z * m[0][2];
    let y2 = v.x * m[1][0] + v.y * m[1][1] + v.z * m[1][2];
    let z2 = v.x * m[2][0] + v.y * m[2][1] + v.z * m[2][2];
    return normalize(vec3f(x2,y2,z2)) ;
}

`