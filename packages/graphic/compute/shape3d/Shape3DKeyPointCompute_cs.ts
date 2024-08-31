import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

/**
 * @internal
 */
export let Shape3DKeyPointCompute_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}
   
   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x ;
      cameraUp = rendererData.cameraUp;
      cameraPos = rendererData.cameraPos;
      if(false){
         let vertexBuffer0 = vertexBuffer[0];
         let srcPathBuffer0 = srcPathBuffer[0];
         let srcIndexBuffer0 = srcIndexBuffer[0];
         let maxNodeCount = u32(rendererData.maxNodeCount);
         let skipFace3 = drawBuffer.skipFace3;
      }

      let nodeData = nodeBuffer[globalIndex];
      shapeType = u32(round(nodeData.base.shapeType));
      shapeIndex = globalIndex;
      switch(shapeType){
         case RoundRectShapeType:
         {
            writeRoundRectPath(nodeData);
            break;
         }
         case CircleShapeType:
         {
            writeCirclePath(nodeData);
            break;
         }
         case EllipseShapeType:
         {
            writeEllipsePath(nodeData);
            break;
         }
         case Path2DShapeType:
         {
            writePath2DPath(nodeData);
            break;
         }
         case Path3DShapeType:
         {
            writePath3DPath(nodeData);
            break;
         }
         default:
         {
            break;
         }
      }
      
   }


`