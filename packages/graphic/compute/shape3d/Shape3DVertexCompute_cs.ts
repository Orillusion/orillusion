import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

/**
 * @internal
 */
export let Shape3DVertexCompute_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}

   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      cameraUp = rendererData.cameraUp;
      cameraPos = rendererData.cameraPos;
      
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x;
      if(globalIndex < u32(rendererData.usedDestPointCount) )
      {
         let keyPoint = destPathBuffer[globalIndex];
         if(false){
            let srcPathBuffer0 = srcPathBuffer[0]; 
         }

         shapeIndex = u32(round(keyPoint.shapeIndex));
         var nodeData = nodeBuffer[shapeIndex];
         shapeType = u32(round(nodeData.base.shapeType));
         if(shapeType == 0u){
            return;
         }
         let depthRangeEachShape = rendererData.zFightingRange / (rendererData.maxNodeCount + 1.0);
         lineOffsetY = (nodeData.base.shapeOrder + 0.5) * depthRangeEachShape;
         fillOffsetY = nodeData.base.shapeOrder * depthRangeEachShape;

         switch(shapeType){
            case RoundRectShapeType:
            {
               drawRoundRectFace(nodeData, keyPoint);
               break;
            }
            case CircleShapeType:
            {
               drawCircleFace(nodeData, keyPoint);
               break;
            }
            case EllipseShapeType:
            {
               drawEllipseFace(nodeData, keyPoint);
               break;
            }
            case Path2DShapeType:
            {
               drawPath2DFace(nodeData, keyPoint);
               break;
            }
            case Path3DShapeType:
            {
               drawPath3DFace(nodeData, keyPoint);
               break;
            }
            default:
            {
               //drawFace(globalIndex,zero_pos,zero_pos,zero_pos,zero_uv,zero_uv,zero_uv);
               break;
            }
         }
      }
 }
`