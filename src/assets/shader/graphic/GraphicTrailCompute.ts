export let graphicTrailCompute = (segmentCode: number) => {
    let code = /*wgsl*/`
    #include "GlobalUniform"
    struct VertexInfo{
        position:vec3f,
        // px:f32,
        // py:f32,
        // pz:f32,
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
        faceMode: f32,
        right: vec4f,
        ids:array<f32,${segmentCode}>
    }

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    @group(0) @binding(2) var<storage, read> trailBuffer : array<TrailInfo>;
    @group(0) @binding(3) var<storage, read> models : array<mat4x4<f32>>;

    var<private> time:f32;
    var<private> viewDir:vec3f;

    @compute @workgroup_size(256)
    fn CsMain(@builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32>){
        let rID = workgroup_id.x ;
        let trailInfo = trailBuffer[rID];
        let vLen = u32(trailInfo.segment+1.0) ;
        let vID = local_invocation_id.x ;

        if(trailInfo.visible > 0.0 && vID < vLen ){
            time = globalUniform.time * 0.001;
            viewDir = -normalize(globalUniform.cameraWorldMatrix[2].xyz) ;
            var right:vec3f ;
            
            switch (u32(trailInfo.faceMode)) {
                case 0u:{
                    right = getBillRightRightByMode(vID,vLen,trailInfo) ;
                    break;
                }
                case 1u:{
                    right = trailInfo.right.xyz;
                    break;
                }
                case 2u:{
                    right = trailInfo.right.xyz;
                    break;
                }
                default:{
                    break;
                }
            }

            writeTOBuffer(rID,vID,vLen,right,trailInfo);
        }
    }

    fn getBillRightRightByMode( vID:u32 , vLen:u32, trailInfo:TrailInfo ) -> vec3f{
        var right:vec3f;
        if(vID==0u){
            // first
            let sp0 = models[i32(trailInfo.ids[ 0 ])][3].xyz ;
            let sp1 = models[i32(trailInfo.ids[ 1 ])][3].xyz ;
            let firstFront = normalize(sp1 - sp0) ;
            right = normalize(cross(firstFront,viewDir));
        }else if( vID < (vLen-1) ){
            // body
            let bp0 = models[i32(trailInfo.ids[vID-1])][3].xyz ;
            let bp1 = models[i32(trailInfo.ids[vID])][3].xyz ;
            let bp2 = models[i32(trailInfo.ids[vID+1])][3].xyz ;
            right = getRight(bp0,bp1,bp2,viewDir) ;
        }else{
            // last
            let ep0 = models[i32(trailInfo.ids[u32(trailInfo.segment)-1u])][3].xyz ;
            let ep1 = models[i32(trailInfo.ids[u32(trailInfo.segment)])][3].xyz ;
            let endFront = normalize(ep1 - ep0) ;
            right = normalize(cross(endFront,viewDir));
        }
        return normalize(right) ; 
    }

    fn writeTOBuffer(rID:u32, vID:u32 , vLen:u32, right:vec3f , trailInfo:TrailInfo ){
        let i0 = (vID + (vLen * rID)) * 2u ;
        let i1 = i0 + 0u ;
        let i2 = i0 + 1u ;

        let worldPos = models[i32(trailInfo.ids[vID])][3].xyz ;
        let leftPos = worldPos - right.xyz * trailInfo.width ;
        let rightPos = worldPos + right.xyz * trailInfo.width ;

        vertexBuffer[i1].position = leftPos ;
        vertexBuffer[i2].position = rightPos ;

        let uvS = time * trailInfo.uvSpeed ;

        vertexBuffer[i1].uv_x = (trailInfo.uv.x) + uvS.x ;
        vertexBuffer[i2].uv_x = (trailInfo.uv.z + trailInfo.uv.x) + uvS.x ;

        let v = (1.0 - f32(vID) / trailInfo.segment) * trailInfo.uv.w + trailInfo.uv.y;
        vertexBuffer[i1].uv_y = v + uvS.y ;
        vertexBuffer[i2].uv_y = v + uvS.y ;
    }

    fn getRight(p0:vec3f,p1:vec3f,p2:vec3f,v:vec3f) -> vec3f {
        let d0 = (p1 - p0) ;
        let d1 = (p2 - p1) ;
        let d2 = ((d0 + d1) ) ;
        return (cross(d2,v)) ;
    }
    `
    return code;
}


