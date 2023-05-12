export let ClusterLighting_cs: string = /*wgsl*/`
#include "GlobalUniform"

struct ClusterBox{
    minPoint:vec4<f32>,
    maxPoint:vec4<f32>
}

struct Light {
    index:f32,
    lightType:i32,
    radius:f32,
    linear:f32,

    position:vec3<f32>,
    lightMatrixIndex:f32,

    direction:vec3<f32>,
    quadratic:f32,

    lightColor:vec3<f32>,
    intensity:f32,

    innerCutOff :f32,
    outerCutOff:f32,
    range :f32,
    castShadow:f32,

    lightTangent:vec3<f32>,
    ies:f32,
};

struct LightIndex
{
    count:f32,
    start:f32,
    empty0:f32,
    empty1:f32,
};

struct ClustersUniform{
    clusterTileX:f32,
    clusterTileY:f32,
    clusterTileZ:f32,
    numLights:f32,
    maxNumLightsPerCluster:f32,
    near:f32,
    far:f32,
    screenWidth:f32,
    screenHeight:f32,
    clusterPix:f32, 
}

struct Uniforms {
    matrix : array<mat4x4<f32>>
};



var<private> clusterTileX:f32 ;
var<private> clusterTileY:f32 ;
var<private> clusterTileZ:f32 ;

@group(0) @binding(1) var<storage, read> models : Uniforms;
@group(0) @binding(2) var<uniform> clustersUniform : ClustersUniform;
@group(0) @binding(3) var<storage,read> clusterBuffer : array<ClusterBox>;
@group(0) @binding(4) var<storage,read> lightBuffer : array<Light>;
@group(0) @binding(5) var<storage,read_write> lightAssignBuffer : array<f32>;
@group(0) @binding(6) var<storage,read_write> assignTable : array<LightIndex>;

fn gridToIndex(i:vec3<u32>) -> u32{
    return i.z * u32(clusterTileX) * u32(clusterTileY) + i.y * u32(clusterTileX) + i.x ;
}

fn GetSqdisPointAABB( pos:vec3<f32>,  clusterIndex:u32 ) -> f32
{
    var sqDistance = 0.0;
    let cluster = clusterBuffer[clusterIndex];
    for (var i = 0u; i < 3u; i+=1u)
    {
        var v = pos[i];
        if (v < cluster.minPoint[i])
        {
            let diff = cluster.minPoint[i] - v;
            sqDistance += diff * diff;
        }

        if (v > cluster.maxPoint[i])
        {
            let diff =  v - cluster.maxPoint[i];
            sqDistance += diff * diff;
        }
    }
    return sqDistance;
}

fn TestSphereAABB( lightIndex:i32 ,  clusterIndex : u32 ) -> bool
{
    let light = lightBuffer[lightIndex];
    let lightPos = models.matrix[u32(light.lightMatrixIndex)][3].xyz;
    var radius = light.range * 2.0 ;
    let spherePos =  globalUniform.viewMat * vec4<f32>(lightPos.xyz, 1.0) ;
    let sqDistance = GetSqdisPointAABB(spherePos.xyz , clusterIndex);
    return sqDistance <= (radius*radius);
}



@compute @workgroup_size(16,9,1)
fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32> ){
    clusterTileX = clustersUniform.clusterTileX;
    clusterTileY = clustersUniform.clusterTileY;
    clusterTileZ = clustersUniform.clusterTileZ;
    // cluster ID 
    let i = local_invocation_id.x ;
    let j = local_invocation_id.y ;
    let k = workgroup_id.x ;

    var clusterId_3D = vec3<u32>(i,j,k);
    var clusterId_1D = gridToIndex(clusterId_3D);

    var startIndex = i32(clusterId_1D) * i32(clustersUniform.maxNumLightsPerCluster) ;
    var endIndex = startIndex;

    for(var lightID = 0 ; lightID < i32(clustersUniform.numLights) ; lightID+=1)
    {
        if(!TestSphereAABB(lightID, clusterId_1D)) {
           continue;
        };
        lightAssignBuffer[endIndex] = f32(lightID);
        endIndex += 1 ;
    }

    // workgroupBarrier();

    var idx: LightIndex;
    idx.count = f32(endIndex-startIndex);
    idx.start = f32(startIndex);
    assignTable[clusterId_1D] = idx;
}
`