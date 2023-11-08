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

var<private> rights:array<vec3f,128>;

@compute @workgroup_size(1)
fn CsMain(@builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>){
    let indexTrail = globalInvocation_id.x ;
    let trailInfo = trailBuffer[indexTrail];
    let viewDir = normalize(globalUniform.cameraWorldMatrix[2].xyz) ;

    if(trailInfo.visible > 0.0){
        let segmentLength = u32(trailInfo.segment + 1.0);
        let first = indexTrail * segmentLength ;
        let len = first + segmentLength ;
        let time = globalUniform.time * 0.001;

        //**first*******
        let sp0 = models[i32(trailInfo.ids[ 0 ])][3].xyz ;
        let sp1 = models[i32(trailInfo.ids[ 1 ])][3].xyz ;
        let firstFront = normalize(sp1 - sp0) ;
        rights[0] = normalize(cross(firstFront,viewDir));
        // rights[0] = viewDir;
        //**************
        //**body*******
        for (var i:u32 = 1; i < u32(trailInfo.segment+1.0) - 1u ; i += 1u) {
            let bp0 = models[i32(trailInfo.ids[i-1])][3].xyz ;
            let bp1 = models[i32(trailInfo.ids[i])][3].xyz ;
            let bp2 = models[i32(trailInfo.ids[i+1])][3].xyz ;
            rights[i] = getRight(bp0,bp1,bp2,viewDir) ;
        }
        //**************
        //**end*******
        let ep0 = models[i32(trailInfo.ids[u32(trailInfo.segment)-1u])][3].xyz ;
        let ep1 = models[i32(trailInfo.ids[u32(trailInfo.segment)])][3].xyz ;
        let endFront = normalize(ep1 - ep0) ;
        rights[u32(trailInfo.segment)] = normalize(cross(endFront,viewDir));
        //**************

        for (var i:u32 = 0u ; i < segmentLength ; i += 1u) {
            let i1 = ((i + (segmentLength * indexTrail)) * 2u + 0u) ;
            let i2 = ((i + (segmentLength * indexTrail)) * 2u + 1u) ;
   
            let right = rights[i];
            let worldPos = models[i32(trailInfo.ids[i])][3].xyz ;
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
    
            let v = (1.0 - f32(i) / trailInfo.segment) * trailInfo.uv.w + trailInfo.uv.y;
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

fn getRight(p0:vec3f,p1:vec3f,p2:vec3f,v:vec3f) -> vec3f {
    let d0 = normalize(p1 - p0) ;
    let d1 = normalize(p2 - p1) ;
    let d2 = normalize((d0 + d1) ) ;
    return normalize(cross(d2,v)) ;
}

`