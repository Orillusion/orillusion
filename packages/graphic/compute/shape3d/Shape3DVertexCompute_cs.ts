import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

export let Shape3DVertexCompute_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}

   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x;
      let sss = srcPathBuffer[0];
      if(globalIndex < u32(rendererData.usedDestPointCount) )
      {
         let keyPoint = destPathBuffer[globalIndex];
         var nodeData = nodeBuffer[u32(keyPoint.shapeIndex)];
         shapeType = u32(round(nodeData.base.shapeType));
         shapeIndex = u32(round(nodeData.base.shapeIndex));
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