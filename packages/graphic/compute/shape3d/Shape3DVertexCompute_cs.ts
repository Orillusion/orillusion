import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

export let Shape3DVertexCompute_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}

   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x;
      if(globalIndex < u32(rendererData.usedDestPointCount) )
      {
         let keyPoint = destPathBuffer[globalIndex];
         shapeIndex = u32(round(keyPoint.shapeIndex));
         var nodeData = nodeBuffer[shapeIndex];
         shapeType = u32(round(nodeData.base.shapeType));
         
         var offsetY = rendererData.zFightingScale / (rendererData.maxNodeCount + 1.0);
         lineOffsetY = (nodeData.base.shapeOrder + 0.5) * offsetY;
         fillOffsetY = nodeData.base.shapeOrder * offsetY;

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
            case LineShapeType:
            {
               drawLineFace(nodeData, keyPoint);
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