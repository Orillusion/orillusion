/**
 * @internal
 */
export let graphicDynamicCompute = (subCode: string) => {
    let code = /*wgsl*/`
    #include "GlobalUniform"
    #include "MatrixShader"

    ${subCode}

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

    struct DrawInfo{
        skipFace:atomic<u32>,
        skipFace2:u32,
        skipFace3:u32,
        skipFace4:u32,
    }

    var<private> uv0 = vec2f(0.0, 0.0);
    var<private> uv1 = vec2f(1.0, 0.0);
    var<private> uv2 = vec2f(1.0, 1.0);
    var<private> uv3 = vec2f(0.0, 1.0);

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    @group(0) @binding(2) var<storage, read_write> drawBuffer : DrawInfo ;
    
    @compute @workgroup_size(256,1,1)
    fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32>){
        compute(workgroup_id,local_invocation_id);
    }

    //* gID mesh vertex group id
    //* v1 face vertex 1 position 
    //* v2 face vertex 2 position 
    //* v3 face vertex 3 position 
    //* u1 face uv 1  
    //* u2 face uv 2  
    //* u3 face uv 3  
    fn drawFace(gID:u32, v1:vec3f, v2:vec3f , v3:vec3f , u1:vec2f , u2:vec2f, u3:vec2f){
        let uv2 = vec2f(0.0,0.0);
        var fID = atomicAdd(&drawBuffer.skipFace,1u);
        drawFace2(gID, fID, v1, v2, v3, u1, u2, u3, uv2);
    }

    fn drawLine(gID:u32, v1:vec3f, v2:vec3f , v3:vec3f , u1:vec2f , u2:vec2f, u3:vec2f){
        let uv2 = vec2f(1.0,0.0);
        var fID = atomicAdd(&drawBuffer.skipFace,1u);  
        drawFace2(gID, fID, v1, v2, v3, u1, u2, u3, uv2);
    }

    fn drawFace2(gID:u32, fID:u32, v1:vec3f , v2:vec3f , v3:vec3f , u1:vec2f , u2:vec2f, u3:vec2f, uv2:vec2f){
        let n = getNormal(v1,v2,v3);
        writeVertexBuffer(gID , fID * 3u + 0u, v1, n, u1, uv2);
        writeVertexBuffer(gID , fID * 3u + 1u, v2, n, u2, uv2);
        writeVertexBuffer(gID , fID * 3u + 2u, v3, n, u3, uv2);
    }

    fn drawRect(gID:u32,center:vec3f,width:f32,height:f32,rotX:f32,rotY:f32,rotZ:f32){
        let minX = -width * 0.5;
        let maxX = width * 0.5;
        let minY = -height * 0.5;
        let maxY = height * 0.5;

        let mat = buildRotateXYZMat4(rotX,rotY,rotZ,center.x, center.y, center.z);

        let p0 = mat * vec4f(minX,maxY,0.0,1.0);
        let p1 = mat * vec4f(maxX,maxY,0.0,1.0);
        let p2 = mat * vec4f(maxX,minY,0.0,1.0);
        let p3 = mat * vec4f(minX,minY,0.0,1.0);

        drawFace(gID,p0.xyz,p1.xyz,p2.xyz,uv0,uv1,uv2);
        drawFace(gID,p0.xyz,p2.xyz,p3.xyz,uv0,uv2,uv3);
    }

    fn drawCube(gID:u32,center:vec3f,width:f32,height:f32,depth:f32,rotX:f32,rotY:f32,rotZ:f32){
        let minX = -width * 0.5;
        let maxX = width * 0.5;
        let minY = -height * 0.5;
        let maxY = height * 0.5;
        let minZ = -depth * 0.5;
        let maxZ = depth * 0.5;

        let mat = buildRotateXYZMat4(rotX,rotY,rotZ,center.x, center.y, center.z);

        let p0 = mat * vec4f(minX,maxY,minZ,1.0);
        let p1 = mat * vec4f(maxX,maxY,minZ,1.0);
        let p2 = mat * vec4f(maxX,minY,minZ,1.0);
        let p3 = mat * vec4f(minX,minY,minZ,1.0);

        let p4 = mat * vec4f(maxX,maxY,maxZ,1.0);
        let p5 = mat * vec4f(minX,maxY,maxZ,1.0);
        let p6 = mat * vec4f(minX,minY,maxZ,1.0);
        let p7 = mat * vec4f(maxX,minY,maxZ,1.0);

        drawFace(gID,p0.xyz,p1.xyz,p2.xyz,uv0,uv1,uv2);
        drawFace(gID,p0.xyz,p2.xyz,p3.xyz,uv0,uv2,uv3);
        drawFace(gID,p1.xyz,p4.xyz,p7.xyz,uv0,uv1,uv2);
        drawFace(gID,p1.xyz,p7.xyz,p2.xyz,uv0,uv2,uv3);
        drawFace(gID,p4.xyz,p5.xyz,p6.xyz,uv0,uv1,uv2);
        drawFace(gID,p4.xyz,p6.xyz,p7.xyz,uv0,uv2,uv3);
        drawFace(gID,p1.xyz,p0.xyz,p5.xyz,uv0,uv1,uv2);
        drawFace(gID,p1.xyz,p5.xyz,p4.xyz,uv0,uv2,uv3);
        drawFace(gID,p0.xyz,p3.xyz,p6.xyz,uv1,uv2,uv3);
        drawFace(gID,p0.xyz,p6.xyz,p5.xyz,uv1,uv3,uv0);
        drawFace(gID,p2.xyz,p6.xyz,p3.xyz,uv1,uv3,uv0);
        drawFace(gID,p2.xyz,p7.xyz,p6.xyz,uv1,uv2,uv3);
    }

    //** compute face normal */
    fn getNormal(v1:vec3f , v2:vec3f , v3:vec3f) -> vec3f{
        let p0 = v2 - v1 ;
        let p1 = v3 - v2 ;
        let n = cross(p0,p1);
        return normalize(n);
    }

    //** write vertice data to geometry */
    fn writeVertexBuffer( gID:u32, vID:u32 , pos:vec3f , normal:vec3f , uv:vec2f, uv2:vec2f ){
        vertexBuffer[vID].position = pos;
        vertexBuffer[vID].nx = normal.x ;
        vertexBuffer[vID].ny = normal.y ;
        vertexBuffer[vID].nz = normal.z ;
        vertexBuffer[vID].uv_x = uv.x ;
        vertexBuffer[vID].uv_y = uv.y ;
        vertexBuffer[vID].uv2_x = uv2.x ;
        vertexBuffer[vID].uv2_y = uv2.y ;
        vertexBuffer[vID].index = f32(gID) ;
    }

    fn GetDistance( pos: vec3f,  plane : vec4f ) -> f32 {
        return plane.x * pos.x + plane.y * pos.y + plane.z * pos.z + plane.w;
     }
  
     fn IsOutofFrustum( pos:vec3f , radius: f32) -> bool {
        var c: i32 = 0;
        var d: f32 = 0.0;
        for(var i :i32 = 0; i < 6; i++){
           d = GetDistance(pos, globalUniform.frustumPlanes[i]);
           if (d <= -radius) {
              return false;
           }
           if (d > radius) {
              c++;
           }
       }
       return c > 0;
     }

    `
    return code;
}


