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
        up: vec4f,
        ids:array<f32,${segmentCode}>
    }

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    @group(0) @binding(2) var<storage, read> trailBuffer : array<TrailInfo>;
    @group(0) @binding(3) var<storage, read> models : array<mat4x4<f32>>;

    var<private> time:f32;
    var<private> viewDir:vec3f;

    @compute @workgroup_size(256)
    fn CsMain(@builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) global_invocation_id : vec3<u32>){
        let rID = workgroup_id.x ;
        let trailInfo = trailBuffer[rID];
        let vLen = u32(trailInfo.segment+1.0) ;
        let vID = global_invocation_id.x ;

        // if(vID < vLen ){
            time = globalUniform.time * 0.001;
            var right:vec3f ;
            
            switch (u32(trailInfo.faceMode)) {
                case 0u:{
                    right = getRightByMode(vID,vLen,viewDir,trailInfo) ;
                    break;
                }
                case 1u:{
                    right = vec3f(0.0,0.0,1.0) ;
                    break;
                }
                case 2u:{
                    right = getRightByMode(vID,vLen,trailInfo.up.xyz,trailInfo) ;
                    break;
                }
                default:{
                    break;
                }
            }
            writeTOBuffer(rID,vID,vLen,right,trailInfo);
        // }
    }

 

    fn writeTOBuffer(rID:u32, vID:u32 , vLen:u32, right:vec3f , trailInfo:TrailInfo ){
        let i0 = (vID + (vLen * rID)) * 2u ;
        let li = i0 + 0u ;
        let ri = i0 + 1u ;

        let worldPos = models[i32(trailInfo.ids[vID])][3].xyz ;
        let leftPos = worldPos - right.xyz * trailInfo.width ;
        let rightPos = worldPos + right.xyz * trailInfo.width ;

        vertexBuffer[li].position = leftPos ;
        vertexBuffer[ri].position = rightPos ;

        let uvS = time * trailInfo.uvSpeed ;

        vertexBuffer[li].uv_x = (trailInfo.uv.x) + uvS.x ;
        vertexBuffer[ri].uv_x = (trailInfo.uv.z + trailInfo.uv.x) + uvS.x ;

        // var ld = 0.0 ;
        // var rd = 0.0 ;
        // if(vID>0u){
        //     let vid0 = getVID(vID,vLen,rID);
        //     let vid1 = getVID(vID-1u,vLen,rID);
        
        //     ld = distance( vertexBuffer[li].position , vertexBuffer[vid1.x].position ) ;
        //     rd = distance( vertexBuffer[ri].position , vertexBuffer[vid1.y].position ) ;

        //     vertexBuffer[li].uv_y = vertexBuffer[vid1.x].uv_y + 1.0 / ld * 100.0 ;//+ uvS.y ;
        //     vertexBuffer[ri].uv_y = vertexBuffer[vid1.y].uv_y + 1.0 / rd * 100.0 ;//+ uvS.y ;
        // }else{
            let v = (1.0 - f32(vID) / trailInfo.segment) * trailInfo.uv.w + trailInfo.uv.y;
            vertexBuffer[li].uv_y = v + uvS.y ;
            vertexBuffer[ri].uv_y = v + uvS.y ;
        // }
    }

    fn getRight(p0:vec3f,p1:vec3f,p2:vec3f,up:vec3f) -> vec3f {
        let d0 = normalize(p1 - p0) ;
        let d1 = normalize(p2 - p1) ;
        // var a = dot(d0,d1) ;
        // var ep = 0.0 ;
        // if(a<0.0){
        //     a = -a ;
        //     ep = 1.0/sin(a*0.25) ;
        // }else if(a == 0.0){
        //     ep = 1.414 ;
        // }else{
        //     ep = 1.0 ;
        // }
        let forward = normalize((d0 + d1)+ vec3f(0.000001,0.000001,0.000001)) ;
        return normalize(cross(forward,up)) ;//* ep ;
    }

    fn getVID(vID:u32,vLen:u32,rID:u32) -> vec2<u32> {
        let i0 = (vID + (vLen * rID)) * 2u ;
        let li = i0 + 0u ;
        let ri = i0 + 1u ;
        return vec2<u32>(li,ri);
    }

    fn getRightByMode( vID:u32 , vLen:u32, up:vec3f, trailInfo:TrailInfo ) -> vec3f{
        var right:vec3f;
        if(vID==0u){
            // first
            let sp0 = models[i32(trailInfo.ids[ 0 ])][3].xyz ;
            let sp1 = models[i32(trailInfo.ids[ 1 ])][3].xyz ;
            let firstFront = normalize(sp1 - sp0) ;
            viewDir = -normalize(globalUniform.CameraPos.xyz - sp0) ;
            right = normalize(cross(firstFront,viewDir));
        }else if( vID < (vLen-1) ){
            // body
            let bp0 = models[i32(trailInfo.ids[vID-1])][3].xyz ;
            let bp1 = models[i32(trailInfo.ids[vID])][3].xyz ;
            let bp2 = models[i32(trailInfo.ids[vID+1])][3].xyz ;
            viewDir = -normalize(globalUniform.CameraPos.xyz - bp1) ;
            right = getRight(bp0,bp1,bp2,viewDir) ;
        }else{
            // last
            let ep0 = models[i32(trailInfo.ids[u32(trailInfo.segment)-1u])][3].xyz ;
            let ep1 = models[i32(trailInfo.ids[u32(trailInfo.segment)])][3].xyz ;
            let endFront = normalize(ep1 - ep0) ;
            viewDir = -normalize(globalUniform.CameraPos.xyz - ep1) ;
            right = normalize(cross(endFront,viewDir));
        }
        return normalize(right) ; 
    }
    `
    return code;
}


