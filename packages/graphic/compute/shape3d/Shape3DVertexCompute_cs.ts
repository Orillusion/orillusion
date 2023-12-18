import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

export let Shape3DVertexCompute_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}

   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x;
      if(globalIndex < u32(rendererData.usedKeyPointCount) )
      {
         let keyPoint = destPathBuffer[globalIndex];
         var nodeData = nodeBuffer[u32(keyPoint.shapeIndex)];
         let shapeType = u32(round(nodeData.base.shapeType));
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
            default:
            {
               //drawFace(globalIndex,zero_pos,zero_pos,zero_pos,zero_uv,zero_uv,zero_uv);
               break;
            }
         }
      }else{
       // drawFace(globalIndex,zero_pos,zero_pos,zero_pos,zero_uv,zero_uv,zero_uv);
      }
 }
`