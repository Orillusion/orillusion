import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

/**
 * @internal
 */
export let Shape3DVertexFillZero_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}

   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x;

      if(false){
         let skipFace2 = drawBuffer.skipFace2;
         let destPathBuffer0 = destPathBuffer[0];
         let srcPathBuffer0 = srcPathBuffer[0];
         let srcIndexBuffer0 = srcIndexBuffer[0];
         let vertexBuffer0 = vertexBuffer[0];
         var nodeData = nodeBuffer[0];
      }
      
      if(globalIndex < u32(rendererData.maxFaceCount))
      {
         drawFace2(globalIndex, globalIndex, zero_pos,zero_pos,zero_pos,zero_uv,zero_uv,zero_uv,zero_uv);
      }
 }
`