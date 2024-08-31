/**
 * @internal
 */
export let GrassGeometryCompute_cs = /*wgsl*/`
   struct GrassNode {
      grassCount: f32,
      grassHSegment: f32,
      grassWight: f32,
      grassHeigh: f32,
      grassX: f32,
      grassY: f32,
      grassZ: f32,
      grassRotation: f32
   }

   @group(0) @binding(3) var<storage, read> nodeBuffer : array<GrassNode> ;

   var<private> zero_pos : vec3f = vec3f(0.0,0.0,0.0);
   var<private> zero_uv : vec2f = vec2f(0.0,0.0);

   

   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
    // Grass geometry compute code goes here
      var time = globalUniform.time * 0.005;
      let globalIndex = workgroup_id.x * 256u + local_invocation_id.x ;
      if(globalIndex < drawBuffer.skipFace2 * 12u){
         // if(globalIndex == 0u){
         // }

         let nodeInfo = nodeBuffer[globalIndex];
         let posWs = vec3f(nodeInfo.grassX, nodeInfo.grassY, nodeInfo.grassZ) ;
         if(IsOutofFrustum(posWs.xyz,0.1)){
            // drawCube(globalIndex,posWs,nodeInfo.grassWight,nodeInfo.grassWight,nodeInfo.grassWight,0.0,time,0.0);

            let mat = buildYRotateXMat4(nodeInfo.grassRotation,posWs.x, posWs.y, posWs.z);
            let vertexOffset = vec4f(sin(time + f32(local_invocation_id.x) / 16.0 )  ,0.0,0.0,0.0);
   
            let width = nodeInfo.grassWight * 0.5 ;
            let height = nodeInfo.grassHeigh * 0.5  ;
                     
            // var p0 = (mat * vec4f(-width, height, 0.0,1.0))  + vertexOffset;
            // var p1 = (mat * vec4f(width, height, 0.0,1.0))  + vertexOffset;
            // var p2 = mat * vec4f(width, 0.0, 0.0,1.0) ;
            // var p3 = mat * vec4f(-width, 0.0, 0.0,1.0) ;
   
            // let u0 = vec2f(0.0, 0.0);
            // let u1 = vec2f(1.0, 0.0);
            // let u2 = vec2f(1.0, 1.0);
            // let u3 = vec2f(0.0, 1.0);
        
            // drawFace(globalIndex,p0.xyz,p1.xyz,p2.xyz,u0,u1,u2);
            // drawFace(globalIndex,p0.xyz,p2.xyz,p3.xyz,u0,u2,u3);

            var p0 = (mat * vec4f(width * 0.5, height, 0.0,1.0)) + vertexOffset;
            var p1 = (mat * vec4f(-width, 0.0, 0.0,1.0)) ;// + vertexOffset;
            var p2 = mat * vec4f(width, 0.0, 0.0,1.0) ;
            let u0 = vec2f(0.5, 0.0);
            let u1 = vec2f(1.0, 1.0);
            let u2 = vec2f(0.0, 1.0);
            drawFace(globalIndex,p0.xyz,p1.xyz,p2.xyz,u0,u1,u2);

         }else{
            // drawCube(globalIndex,zero_pos,0.0,0.0,0.0,0.0,0.0,0.0);
            drawFace(globalIndex,zero_pos,zero_pos,zero_pos,zero_uv,zero_uv,zero_uv);
         }
      }
 }
`