import { Shape3DCommonCode_cs } from "./Shape3DCommonCode_cs";

export let Shape3DKeyPointCompute_cs = /*wgsl*/`
   ${Shape3DCommonCode_cs}
   
   fn compute(workgroup_id:vec3<u32>,local_invocation_id:vec3<u32>) {
      var time = globalUniform.time;
      globalIndex = workgroup_id.x * 256u + local_invocation_id.x ;
      
      let vertexBuffer0 = vertexBuffer[0];
      let sss = srcPathBuffer[0];
      let usedShapeCount = u32(rendererData.usedShapeCount);
      let skipFace3 = drawBuffer.skipFace3 ;
      if(globalIndex < usedShapeCount){
         let nodeData = nodeBuffer[globalIndex];
         shapeType = u32(round(nodeData.base.shapeType));
         shapeIndex = u32(round(nodeData.base.shapeIndex));
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
            case LineShapeType:
            {
               writeLinePath(nodeData);
               break;
            }
            default:
            {
               break;
            }
         }
      }
      

      
   }


`