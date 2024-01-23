export let graphicFaceCompute2 = (segmentCode: number) => {
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
        height:f32,
        pathCount:f32,
        uSpeed:f32,
        vSpeed:f32,
        radiu:f32,
        paths:array<vec4f,${segmentCode}>
    }

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    // @group(0) @binding(2) var<storage, read_write> geometryInfoBuffer : array<GeometryInfo>;
    @group(0) @binding(2) var<storage, read> shapeBuffer : array<ShapeInfo>;
    // @group(0) @binding(3) var<storage, read> models : array<mat4x4<f32>>;
    var<private> shapeIndex:u32 ;
    var<private> segIndex:u32 ;
    var<private> segCount:u32 ;
    var<private> time:f32 ;
    var<private> shape:ShapeInfo ;
    @compute @workgroup_size(256)
    fn CsMain(@builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) global_invocation_id : vec3<u32>){
        shapeIndex = workgroup_id.x ;
        segIndex = workgroup_id.y * 256u + global_invocation_id.x ;
        shape = shapeBuffer[shapeIndex];
        segCount = u32(shape.pathCount -1.0);
        // segIndex = 3u ;
        if( segIndex < segCount ){
            time = globalUniform.time * 0.001;
            let uv = vec2f(0.0,0.0);
            // geometryInfoBuffer[0].index = 0;
            switch (u32(shape.shapeType)) {
                case 0u:{
                    // drawFace(0u,shape.paths[0].xyz,shape.paths[1].xyz,shape.paths[2].xyz,uv,uv,uv);
                    break;
                }
                case 1u:{
                    // drawFace(0u,shape.paths[0].xyz,shape.paths[1].xyz,shape.paths[2].xyz,uv,uv,uv);
                    // drawFace(1u,shape.paths[2].xyz,shape.paths[3].xyz,shape.paths[0].xyz,uv,uv,uv);
                    break;
                }
                case 2u:{
                    // drawFace(0u,shape.paths[0].xyz,shape.paths[1].xyz,shape.paths[2].xyz,uv,uv,uv);
                    // drawFace(1u,shape.paths[2].xyz,shape.paths[3].xyz,shape.paths[0].xyz,uv,uv,uv);
                    break;
                }
                case 3u:{
                    // if(segIndex < u32(shape.pathCount)){
                        drawLine(segIndex,shape,vec3f(0.0,1.0,0.0));
                    // }
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
            if(segi == 0u){
                let l0 = segi ;
                let l1 = segi + 1u;
                let l2 = segi + 2u;
                genDir(l0,l1,l2,shapeInfo,up);
            }else if(segi == (segCount -1u)){
                let l0 = segi - 1u;
                let l1 = segi ;
                let l2 = segi + 1u;
                genDir2(l0,l1,l2,shapeInfo,up);
            }
        }
    }

    fn genDir(l0:u32,l1:u32,l2:u32,shapeInfo:ShapeInfo,up:vec3f){
        let p0 = shapeInfo.paths[l0].xyz; 
        let p1 = shapeInfo.paths[l1].xyz; 
        let p2 = shapeInfo.paths[l2].xyz; 

        let d0 = normalize(p1 - p0) ;
        let d1 = normalize(p2 - p1) ;
        let dc = normalize(d1 - d0) ;

        let sOe = dot(d0,dc);
        let neg = dirNeg(sOe) ;
        
        let angle = acos(sOe) ;
        let lc = shapeInfo.width / sin(angle) ;

        let right = cross( normalize(d0) , up );
        let first_l = -right * shapeInfo.width + p0;
        let first_r = right * shapeInfo.width + p0;

        let end_l = lc * dc + p1 ;
        // let end_l = -right * shapeInfo.width + p1;
        let end_r = right * shapeInfo.width + p1;
        // let end_r = lc * dc * 2.0 + p1;

        let uScale = 1.0 ;
        let lVScale = length(end_l - first_l);
        let rVScale = length(end_r - first_r);

        let u0 = vec2f(0.0,0.0) ;//* + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time ;
        let u1 = vec2f(uScale,0.0)  ;//* + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time;
        let u2 = vec2f(uScale,rVScale) ;//* + vec2f(0.0,1.0) /* vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time;
        let u3 = vec2f(0.0,lVScale) ;//* + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time ;

        drawFace(l0 * 2u + 0u,first_l,first_r,end_l,u0,u1,u3);
        drawFace(l0 * 2u + 1u,first_r,end_r,end_l,u1,u2,u3);
    }

    
    fn genDir2(l0:u32,l1:u32,l2:u32,shapeInfo:ShapeInfo,up:vec3f){
        let p0 = shapeInfo.paths[l0].xyz; 
        let p1 = shapeInfo.paths[l1].xyz; 
        let p2 = shapeInfo.paths[l2].xyz; 

        let d0 = normalize(p1 - p0) ;
        let d1 = normalize(p2 - p1) ;
        let dc = normalize(d1 - d0) ;

        let sOe = dot(d0,dc);
        let neg = dirNeg(sOe) ;
        
        let angle = acos(sOe) ;
        let lc = shapeInfo.width / sin(angle) ;
        let offsetV = shapeInfo.width / tan(angle) * neg;

        let right = cross( normalize(d1) , up );
        let first_l = lc * dc + p1;
        let first_r = right * shapeInfo.width + p1;

        let end_l = -right * shapeInfo.width + p2;
        let end_r = right * shapeInfo.width + p2;

        let uScale = 1.0 ;
        let lVScale = length(end_l - first_l) ;
        let rVScale = length(end_r - first_r) ;

        let u0 = vec2f(0.0,0.0) ;//* + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time ;
        let u1 = vec2f(uScale,0.0 - offsetV)  ;//* + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time;
        let u2 = vec2f(uScale,rVScale - offsetV) ;//* + vec2f(0.0,1.0) /* vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time;
        let u3 = vec2f(0.0,lVScale) ;//* + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time ;

        drawFace(l1 * 2u + 0u,first_l,first_r,end_l,u0,u1,u3);
        drawFace(l1 * 2u + 1u,first_r,end_r,end_l,u1,u2,u3);
    }

    fn drawPolyStartEnd(segi:u32,shapeInfo:ShapeInfo,up:vec3f){
        let firstSegi = segi ;
        let endSegi = segi + 1u;
        let nextSegi = segi + 2u;

        let p0 = shapeInfo.paths[firstSegi].xyz; 
        let p1 = shapeInfo.paths[endSegi].xyz; 
        // let p2 = shapeInfo.paths[nextSegi].xyz; 

        let dir = p1 - p0 ;
        let right = cross( normalize(dir) , up );
        let first_l = -right * shapeInfo.width + p0;
        let first_r = right * shapeInfo.width + p0;

        let end_l = -right * shapeInfo.width + p1;
        let end_r = right * shapeInfo.width + p1;

        let uScale = 1.0 ;
        let vScale = length(dir);

        let u0 = vec2f(0.0,0.0)  + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time ;
        let u1 = vec2f(uScale,0.0)  + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time;
        let u2 = vec2f(uScale,vScale)  + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time;
        let u3 = vec2f(0.0,vScale) + vec2f(0.0,1.0) * vec2f(shapeInfo.uSpeed,shapeInfo.vSpeed) * time ;

        drawFace(segi * 2u + 0u,first_l,first_r,end_l,u0,u1,u3);
        drawFace(segi * 2u + 1u,first_r,end_r,end_l,u1,u2,u3);
    }

    fn drawFace( fID:u32, v1:vec3f , v2:vec3f , v3:vec3f , u1:vec2f , u2:vec2f, u3:vec2f){
        let uv2 = vec2f(0.0,0.0);
        let n = getNormal(v1,v2,v3);
        writeVertexBuffer(fID*3u+0u,v1,n,u1,uv2);
        writeVertexBuffer(fID*3u+1u,v2,n,u2,uv2);
        writeVertexBuffer(fID*3u+2u,v3,n,u3,uv2);
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

    fn dirNeg(cosO:f32) -> f32{
        var neg = 1.0 ;
        if(cosO == 0.0){
            neg = 0.0 ;
        }else if(cosO < 0.0){
            neg = -1.0 ;
        }
        return neg ;
    }
  
    `
    return code;
}


