/**
 * @internal
 */
export let GraphicLineCompute = () => {
    let code = /*wgsl*/`
    #include "GlobalUniform"
    struct VertexInfo{
        position:vec3f,
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

    struct GeometryInfo{
        index : u32 ,
        faceStart : u32 ,
        faceEnd : u32 ,
        faceCount : u32 ,
    }

    struct ShapeInfo{
        shapeIndex:f32, //face,poly,rectangle,line,cycle,,box,sphere
        shapeType:f32,
        width:f32,
        lineCap:f32,
        
        pathCount:f32,
        uScale:f32,
        vScale:f32,
        lineJoin:f32,

        startPath:f32,
        endPath:f32,
        uSpeed:f32,
        vSpeed:f32,
    }

    struct DrawInfo{
        skipFace:atomic<u32>,
        skipFace2:atomic<u32>,
        skipFace3:atomic<u32>,
        skipFace4:atomic<u32>,
    }

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    // @group(0) @binding(2) var<storage, read_write> geometryInfoBuffer : array<GeometryInfo>;
    @group(0) @binding(2) var<storage, read> shapeBuffer : array<ShapeInfo>;
    @group(0) @binding(3) var<storage, read> pathBuffer : array<vec4f>;
    @group(0) @binding(4) var<storage, read_write> drawBuffer : DrawInfo ;
    // @group(0) @binding(3) var<storage, read> models : array<mat4x4<f32>>;
    var<private> segIndex:u32 ;
    var<private> segCount:u32 ;
    var<private> time:f32 ;
    var<private> pathOffset:u32 ;
    var<private> faceOffset:u32 ;
    // var<private> faceStrip:u32 = 1u ;
    var<private> shape:ShapeInfo ;
    @compute @workgroup_size(256,1,1)
    fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32>){
        shape = shapeBuffer[workgroup_id.x];
        pathOffset = u32(shape.startPath) ;
        segCount = u32(shape.pathCount - 1.0);
        segIndex = workgroup_id.y * 256u + local_invocation_id.x ;
        if( segIndex < segCount ){
            time = globalUniform.time * 0.001;
            let uv = vec2f(0.0,0.0);
            switch (u32(shape.shapeType)) {
                case 0u:{
                    break;
                }
                case 1u:{
                    break;
                }
                case 2u:{
                    break;
                }
                case 3u:{
                    drawLine(segIndex,shape,vec3f(0.0,1.0,0.0));
                    break;
                }
                default:
                {
                    break;
                }
            }
        }
    }

    fn drawLine(segi:u32,shapeInfo:ShapeInfo,up:vec3f){
        if(segCount == 1u){
            drawPolyStartEnd(segi,shapeInfo,up);
        }else{
            if(segi == (segCount - 1u)){
                drawLineEnd(segi,shapeInfo,up);
            }else if(segi == 0u){
                drawLineStart(segi,shapeInfo,up);
            }else{
                drawLineBody(segi,shapeInfo,up);
            }
        }
    }

    fn drawLineBody(segi:u32,shapeInfo:ShapeInfo,up:vec3f){
        let l0 = segi - 1u;
        let l1 = segi ;
        let l2 = segi + 1u;
        let l3 = segi + 2u;

        var newP0 : vec3f ;
        var newP1 : vec3f ;
        var newP2 : vec3f ;
        var newP3 : vec3f ;
        var newP4 : vec3f ;
        var newP5 : vec3f ;
        var newP6 : vec3f ;

        let p0 = pathBuffer[l0+pathOffset].xyz; 
        let p1 = pathBuffer[l1+pathOffset].xyz; 
        let p2 = pathBuffer[l2+pathOffset].xyz; 
        let p3 = pathBuffer[l3+pathOffset].xyz; 

        let d0 = normalize(p1 - p0) ;
        let d1 = normalize(p2 - p1) ;
        let d2 = normalize(p3 - p2) ;

        let right0 = cross(d0 , d1) ;

        var dir0 = normalize(d1 - d0) ;
        var dir1 = normalize(d2 - d1) ;

        var angle0 = acos(dot(d0,dir0)) ;
        var angle1 = acos(dot(dir1,d2)) ; 

        var neg0 = 1.0 ;
        var neg1 = 1.0 ;

        var negD0 = cross(d1,-d0).y ;
        var negD1 = cross(-d1,d2).y ;

        let lc0 = shapeInfo.width / sin(angle0) ;
        let lc1 = shapeInfo.width / sin(angle1) ;

        let d0Right = cross(d1,up);
        let d1Right = cross(d2,up);

        if(negD0<0.0){
            ///neg true
            newP0 = -d0Right * shapeInfo.width + p1 ;
            newP1 = dir0 * lc0 + p1 ;
        }else if( negD0 == 0.0){
            newP0 = -d0Right * shapeInfo.width + p1 ;
            newP1 = d0Right * shapeInfo.width + p1 ;
        }else{
            ///neg false
            newP0 = dir0 * lc0 + p1 ;
            newP1 = d0Right * shapeInfo.width + p1 ;
        }

        if(negD1<0.0){
            ///neg true
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = dir1 * lc1 + p2 ;

            newP4 = d1Right * shapeInfo.width + p2 ;
            newP5 = -dir1 * lc1 + p2 ;
            newP6 = newP2 ;
        }else if(negD1 == 0.0) {
            ///neg false
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = -d0Right * shapeInfo.width + p2 ;

            newP4 = -d1Right * shapeInfo.width + p2 ;
            newP5 = newP3 ;
            newP6 = -dir1 * lc1 + p2 ;
        }else{
            ///neg false
            newP2 = dir1 * lc1 + p2 ;
            newP3 = -d0Right * shapeInfo.width + p2 ;

            newP4 = -d1Right * shapeInfo.width + p2 ;
            newP5 = newP3 ;
            newP6 = -dir1 * lc1 + p2 ;
        }

        let len0 = (dot(newP0 - p1,d1)) ;
        let len1 = (dot(newP1 - p1,d1)) ;
        let len2 = (dot(newP2 - p1,d1)) ;
        let len3 = (dot(newP3 - p1,d1)) ;

        let uvScale = vec2f(shapeInfo.uScale,shapeInfo.vScale) ;// * time ;
        let vRoll = -vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed)  * time ;

        let u0 = vec2f(0.0,len0) * uvScale + vRoll;
        let u1 = vec2f(1.0,len1) * uvScale + vRoll;
        let u2 = vec2f(1.0,len2) * uvScale + vRoll;
        let u3 = vec2f(0.0,len3) * uvScale + vRoll;

        drawFace(newP0,newP1,newP2,u0,u1,u2);
        drawFace(newP0,newP2,newP3,u0,u2,u3);

        if(negD1 != 0.0) {
            let outFaceDir = normalize(d1 + d2);
            let l = dot(newP4 - p2,outFaceDir) * 0.5 ;

            switch (u32(shapeInfo.lineJoin)) {
                case 0u:{
                    var uu0 : vec2f ;
                    var uu1 : vec2f ;
                    var uu2 : vec2f ;
                    if(negD1>0.0){
                        uu0 = vec2f(1.0,0.0) * uvScale - vRoll; 
                        uu1 = vec2f(0.0,-l) * uvScale - vRoll;
                        uu2 = vec2f(0.0,l) * uvScale - vRoll;
                    }else{
                        uu0 = vec2f(1.0,-l) * uvScale + vRoll;
                        uu1 = vec2f(1.0,l) * uvScale  + vRoll;
                        uu2 = vec2f(0.0,0.0) * uvScale + vRoll;
                    }
                    drawFace(newP2,newP4,newP3,uu0,uu1,uu2);
                    break;
                }
                case 1u:{
                    // let len4 = dot(newP4 - p2,outFaceDir) ;
                    // let len5 = dot(newP5 - p2,outFaceDir) ;
                    // let len6 = dot(newP3 - p2,outFaceDir) ;
                    // let len7 = dot(newP2 - p2,outFaceDir) ;
        
                    // let vRoll = -vec2f(0.0,1.0) * vec2f(shapeInfo.uScale,shapeInfo.vScale) * time ;
                    // let u4 = vec2f(1.0,-len4) + vRoll; //
                    // let u5 = vec2f(0.0,0.0) + vRoll;  //
                    // let u6 = vec2f(1.0,len4) + vRoll;//
                    // let u7 = vec2f(1.0,0.0) + vRoll;  //
                    // drawFace(l1 * 4u + 2u,newP2,newP4,newP3,u4,u6,u5);
                    // drawFace(l1 * 4u + 3u,newP6,newP5,newP4,u4,u7,u6); 
                    break;
                }
                case 2u:{
                    break;
                }
                default:{
                    break;
                }
            }
            // drawFace(l1 * 4u + 2u,newP2,newP4,newP3,u4,u6,u5);
            // drawFace(l1 * 4u + 3u,newP6,newP5,newP4,u4,u7,u6); 
        }
    }

    fn drawLineStart(segi:u32,shapeInfo:ShapeInfo,up:vec3f){
        let l0 = 0u;
        let l1 = 0u ;
        let l2 = 1u;
        let l3 = 2u;

        var newP0 : vec3f ;
        var newP1 : vec3f ;
        var newP2 : vec3f ;
        var newP3 : vec3f ;
        var newP4 : vec3f ;
        var newP5 : vec3f ;
        var newP6 : vec3f ;

        let p1 = pathBuffer[l1+pathOffset].xyz; 
        let p2 = pathBuffer[l2+pathOffset].xyz; 
        let p0 = normalize(p1 - p2) * 10.0 + p1 ; 
        let p3 = pathBuffer[l3+pathOffset].xyz; 

        let d0 = normalize(p1 - p0) ;
        let d1 = normalize(p2 - p1) ;
        let d2 = normalize(p3 - p2) ;

        let right0 = cross(d0 , d1) ;

        var dir0 = normalize(d1 - d0) ;
        var dir1 = normalize(d2 - d1) ;

        var angle0 = acos(dot(d0,dir0)) ;
        var angle1 = acos(dot(dir1,d2)) ; 

        var neg0 = 1.0 ;
        var neg1 = 1.0 ;

        var negD0 = cross(d1,-d0).y ;
        var negD1 = cross(-d1,d2).y ;

        let lc0 = shapeInfo.width / sin(angle0) ;
        let lc1 = shapeInfo.width / sin(angle1) ;

        let d0Right = cross(d1,up);
        let d1Right = cross(d2,up);

        if(negD0<0.0){
            ///neg true
            newP0 = -d0Right * shapeInfo.width + p1 ;
            newP1 = dir0 * lc0 + p1 ;
        }else if( negD0 == 0.0){
            newP0 = -d0Right * shapeInfo.width + p1 ;
            newP1 = d0Right * shapeInfo.width + p1 ;
        }else{
            ///neg false
            newP0 = dir0 * lc0 + p1 ;
            newP1 = d0Right * shapeInfo.width + p1 ;
        }

        if(negD1<0.0){
            ///neg true
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = dir1 * lc1 + p2 ;

            newP4 = d1Right * shapeInfo.width + p2 ;
            newP5 = -dir1 * lc1 + p2 ;
            newP6 = newP2 ;
        }else if(negD1 == 0.0) {
            ///neg false
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = -d0Right * shapeInfo.width + p2 ;

            newP4 = -d1Right * shapeInfo.width + p2 ;
            newP5 = newP3 ;
            newP6 = -dir1 * lc1 + p2 ;
        }else{
            ///neg false
            newP2 = dir1 * lc1 + p2 ;
            newP3 = -d0Right * shapeInfo.width + p2 ;

            newP4 = -d1Right * shapeInfo.width + p2 ;
            newP5 = newP3 ;
            newP6 = -dir1 * lc1 + p2 ;
        }

        let len0 = (dot(newP0 - p0,d1)) ;
        let len1 = (dot(newP1 - p0,d1)) ;
        let len2 = (dot(newP2 - p0,d1)) ;
        let len3 = (dot(newP3 - p0,d1)) ;

        let uvScale = vec2f(shapeInfo.uScale,shapeInfo.vScale) ;// * time ;
        let vRoll = -vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed)  * time ;

        let u0 = vec2f(0.0,len0) * uvScale + vRoll;
        let u1 = vec2f(1.0,len1) * uvScale + vRoll;
        let u2 = vec2f(1.0,len2) * uvScale + vRoll;
        let u3 = vec2f(0.0,len3) * uvScale + vRoll;

        drawFace(newP0,newP1,newP2,u0,u1,u2);
        drawFace(newP0,newP2,newP3,u0,u2,u3);
        
        if(negD1 != 0.0) {
            let outFaceDir = normalize(d1 + d2);
            let l = dot(newP4 - p2,outFaceDir) * 0.5 ;

            switch (u32(shapeInfo.lineJoin)) {
                case 0u:{
                    var uu0 : vec2f ;
                    var uu1 : vec2f ;
                    var uu2 : vec2f ;
                    if(negD1>0.0){
                        uu0 = vec2f(1.0,0.0) * uvScale - vRoll; 
                        uu1 = vec2f(0.0,-l) * uvScale - vRoll;
                        uu2 = vec2f(0.0,l) * uvScale - vRoll;
                    }else{
                        uu0 = vec2f(1.0,-l) * uvScale + vRoll;
                        uu1 = vec2f(1.0,l) * uvScale  + vRoll;
                        uu2 = vec2f(0.0,0.0) * uvScale + vRoll;
                    }
                    drawFace(newP2,newP4,newP3,uu0,uu1,uu2);
                    break;
                }
                case 1u:{
                    break;
                }
                case 2u:{
                    break;
                }
                default:{
                    break;
                }
            }
        }
    }

    fn drawLineEnd(segi:u32,shapeInfo:ShapeInfo,up:vec3f){
        let l0 = segi - 1u;
        let l1 = segi ;
        let l2 = segi + 1u;
        let l3 = 0u;

        var newP0 : vec3f ;
        var newP1 : vec3f ;
        var newP2 : vec3f ;
        var newP3 : vec3f ;
        var newP4 : vec3f ;
        var newP5 : vec3f ;
        var newP6 : vec3f ;

        let p0 = pathBuffer[l0+pathOffset].xyz; 
        let p1 = pathBuffer[l1+pathOffset].xyz; 
        let p2 = pathBuffer[l2+pathOffset].xyz; 
        let p3 = normalize(p2 - p1) * 10.0 + p2 ; 

        let d0 = normalize(p1 - p0) ;
        let d1 = normalize(p2 - p1) ;
        let d2 = normalize(p3 - p2) ;

        let right0 = cross(d0 , d1) ;

        var dir0 = normalize(d1 - d0) ;
        var dir1 = normalize(d2 - d1) ;

        var angle0 = acos(dot(d0,dir0)) ;
        var angle1 = acos(dot(dir1,d2)) ; 

        var neg0 = 1.0 ;
        var neg1 = 1.0 ;

        var negD0 = cross(d1,-d0).y ;
        var negD1 = cross(-d1,d2).y ;

        let lc0 = shapeInfo.width / sin(angle0) ;
        let lc1 = shapeInfo.width / sin(angle1) ;

        let d0Right = cross(d1,up);
        let d1Right = cross(d2,up);

        if(negD0<0.0){
            ///neg true
            newP0 = -d0Right * shapeInfo.width + p1 ;
            newP1 = dir0 * lc0 + p1 ;
        }else if( negD0 == 0.0){
            newP0 = -d0Right * shapeInfo.width + p1 ;
            newP1 = d0Right * shapeInfo.width + p1 ;
        }else{
            ///neg false
            newP0 = dir0 * lc0 + p1 ;
            newP1 = d0Right * shapeInfo.width + p1 ;
        }

        if(negD1 < 0.0){
            ///neg true
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = dir1 * lc1 + p2 ;

            newP4 = d1Right * shapeInfo.width + p2 ;
            newP5 = -dir1 * lc1 + p2 ;
            newP6 = newP2 ;
        }else if(negD1 == 0.0) {
            ///neg false
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = -d0Right * shapeInfo.width + p2 ;

            newP4 = -d1Right * shapeInfo.width + p2 ;
            newP5 = newP3 ;
            newP6 = -dir1 * lc1 + p2 ;
        }else{
            ///neg false
            // newP2 = dir1 * lc1 + p2 ;
            newP2 = d0Right * shapeInfo.width + p2 ;
            newP3 = -d0Right * shapeInfo.width + p2 ;

            newP4 = -d1Right * shapeInfo.width + p2 ;
            newP5 = newP3 ;
            newP6 = -dir1 * lc1 + p2 ;
        }

        let len0 = (dot(newP0 - p0,d1)) ;
        let len1 = (dot(newP1 - p0,d1)) ;
        let len2 = (dot(newP2 - p0,d1)) ;
        let len3 = (dot(newP3 - p0,d1)) ;

        let uvScale = vec2f(shapeInfo.uScale,shapeInfo.vScale) ;// * time ;
        let vRoll = -vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed)  * time ;

        let u0 = vec2f(0.0,len0) * uvScale + vRoll;
        let u1 = vec2f(1.0,len1) * uvScale + vRoll;
        let u2 = vec2f(1.0,len2) * uvScale + vRoll;
        let u3 = vec2f(0.0,len3) * uvScale + vRoll;

        drawFace(newP0,newP1,newP2,u0,u1,u2);
        drawFace(newP0,newP2,newP3,u0,u2,u3);

        if(negD1 != 0.0) {
            let outFaceDir = normalize(d1 + d2);
            let l = dot(newP4 - p2,outFaceDir) * 0.5 ;

            switch (u32(shapeInfo.lineJoin)) {
                case 0u:{
                    var uu0 : vec2f ;
                    var uu1 : vec2f ;
                    var uu2 : vec2f ;
                    if(negD1>0.0){
                        uu0 = vec2f(1.0,0.0) * uvScale - vRoll; 
                        uu1 = vec2f(0.0,-l) * uvScale - vRoll;
                        uu2 = vec2f(0.0,l) * uvScale - vRoll;
                    }else{
                        uu0 = vec2f(1.0,-l) * uvScale + vRoll;
                        uu1 = vec2f(1.0,l) * uvScale  + vRoll;
                        uu2 = vec2f(0.0,0.0) * uvScale + vRoll;
                    }
                    // drawFace(newP2,newP4,newP3,uu0,uu1,uu2);
                    break;
                }
                case 1u:{
                    // let len4 = dot(newP4 - p2,outFaceDir) ;
                    // let len5 = dot(newP5 - p2,outFaceDir) ;
                    // let len6 = dot(newP3 - p2,outFaceDir) ;
                    // let len7 = dot(newP2 - p2,outFaceDir) ;
        
                    // let vRoll = -vec2f(0.0,1.0) * vec2f(shapeInfo.uScale,shapeInfo.vScale) * time ;
                    // let u4 = vec2f(1.0,-len4) + vRoll; //
                    // let u5 = vec2f(0.0,0.0) + vRoll;  //
                    // let u6 = vec2f(1.0,len4) + vRoll;//
                    // let u7 = vec2f(1.0,0.0) + vRoll;  //
                    // drawFace(l1 * 4u + 2u,newP2,newP4,newP3,u4,u6,u5);
                    // drawFace(l1 * 4u + 3u,newP6,newP5,newP4,u4,u7,u6); 
                    break;
                }
                case 2u:{
                    break;
                }
                default:{
                    break;
                }
            }
            // drawFace(l1 * 4u + 2u,newP2,newP4,newP3,u4,u6,u5);
            // drawFace(l1 * 4u + 3u,newP6,newP5,newP4,u4,u7,u6); 
        }
    }

    fn drawPolyStartEnd(segi:u32,shapeInfo:ShapeInfo,up:vec3f){
        let firstSegi = segi ;
        let endSegi = segi + 1u;
        let nextSegi = segi + 2u;

        let p0 = pathBuffer[firstSegi+pathOffset].xyz; 
        let p1 = pathBuffer[endSegi+pathOffset].xyz; 
        // let p2 = pathBuffer[nextSegi+pathOffset].xyz; 

        let dir = p1 - p0 ;
        let right = cross( normalize(dir) , up );
        let first_l = -right * shapeInfo.width + p0;
        let first_r = right * shapeInfo.width + p0;

        let end_l = -right * shapeInfo.width + p1;
        let end_r = right * shapeInfo.width + p1;

        let uScale = 1.0 ;
        let vScale = length(dir);

        let uvScale = vec2f(shapeInfo.uScale,shapeInfo.vScale) ;// * time ;
        let u0 = vec2f(0.0,0.0) * uvScale ;// + vec2f(0.0,1.0) * vec2f(shapeInfo.uScale,shapeInfo.vScale) * time ;
        let u1 = vec2f(uScale,0.0) * uvScale ;// + vec2f(0.0,1.0) * vec2f(shapeInfo.uScale,shapeInfo.vScale) * time;
        let u2 = vec2f(uScale,vScale) * uvScale ;// + vec2f(0.0,1.0) * vec2f(shapeInfo.uScale,shapeInfo.vScale) * time;
        let u3 = vec2f(0.0,vScale) * uvScale ;//+ vec2f(0.0,1.0) * vec2f(shapeInfo.uScale,shapeInfo.vScale) * time ;

        drawFace(first_l,first_r,end_l,u0,u1,u3);
        drawFace(first_r,end_r,end_l,u1,u2,u3);
    }

    fn drawFace(v1:vec3f , v2:vec3f , v3:vec3f , u1:vec2f , u2:vec2f, u3:vec2f){
        let uv2 = vec2f(0.0,0.0);
        let n = getNormal(v1,v2,v3);
        var fID = atomicAdd(&drawBuffer.skipFace,1u); 
        writeVertexBuffer(fID * 3u + 0u, v1,n,u1,uv2);
        writeVertexBuffer(fID * 3u + 1u,v2,n,u2,uv2);
        writeVertexBuffer(fID * 3u + 2u,v3,n,u3,uv2);
    }

    fn getNormal(v1:vec3f , v2:vec3f , v3:vec3f) -> vec3f{
        let p0 = v2 - v1 ;
        let p1 = v3 - v2 ;
        let n = cross(p0,p1);
        return normalize(n);
    }

    fn writeVertexBuffer( vID:u32 , pos:vec3f , normal:vec3f , uv:vec2f, uv2:vec2f ){
        vertexBuffer[vID].position = pos;
        vertexBuffer[vID].nx = normal.x ;
        vertexBuffer[vID].ny = normal.y ;
        vertexBuffer[vID].nz = normal.z ;
        vertexBuffer[vID].uv_x = uv.x ;
        vertexBuffer[vID].uv_y = uv.y ;
        vertexBuffer[vID].uv2_x = uv2.x ;
        vertexBuffer[vID].uv2_y = uv2.y ;
        vertexBuffer[vID].index = f32(0) ;
    }

    `
    return code;
}


