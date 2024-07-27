/**
 * @internal
 */
export let RoundRectShape3DCode_cs = /*wgsl*/`

struct RoundRectShape3D {
   base:ShapeDataBase,

   cornerSegment:f32,
   useLineWidth:f32,
   width: f32,
   height: f32,

   pathRadius: f32,
   f: f32,
   g:f32,
   h:f32,
}

fn getRoundRectShape3D(node:ShapeData) -> RoundRectShape3D{
   return RoundRectShape3D(
        node.base,
        node.xa, node.xb, node.xc, node.xd,
        node.xe, node.xf, node.xg, node.xh);
}

fn drawRoundRectFace(nodeData:ShapeData, keyPoint:Path3DKeyPoint){
   let shapeData:RoundRectShape3D = getRoundRectShape3D(nodeData);
   drawShapeFace(nodeData, keyPoint, shapeData.useLineWidth, zero_pos);
}


fn writeRoundRectPath(nodeData:ShapeData){
   let shapeData:RoundRectShape3D = getRoundRectShape3D(nodeData);
   let shapeBase = shapeData.base;
   let destPointCount = shapeBase.destPointCount;
   let destPointStart = shapeBase.destPointStart;
   var halfWidth = shapeData.width * 0.5;
   var halfHeight = shapeData.height * 0.5;
   let segmentCount = u32(round(shapeData.cornerSegment)) + 1u;
   var pathRadius = shapeData.pathRadius;
   var lastPoint:vec4<f32>;

   if(segmentCount >= 2u){
      lastPoint = writeRoundCorners(destPointStart, destPointCount, 0.0, vec3f(halfWidth, 0.0, halfHeight), segmentCount, pathRadius, lastPoint);
      lastPoint = writeRoundCorners(destPointStart, destPointCount, 0.25, vec3f(-halfWidth, 0.0, halfHeight), segmentCount, pathRadius, lastPoint);
      lastPoint = writeRoundCorners(destPointStart, destPointCount, 0.5, vec3f(-halfWidth, 0.0, -halfHeight), segmentCount, pathRadius, lastPoint);
      lastPoint = writeRoundCorners(destPointStart, destPointCount, 0.75, vec3f(halfWidth, 0.0, -halfHeight), segmentCount, pathRadius, lastPoint);
   }else{
      lastPoint = writeFlatCorner(destPointStart, 0u, vec3f(halfWidth, 0.0, halfHeight), lastPoint);
      lastPoint = writeFlatCorner(destPointStart, 1u, vec3f(-halfWidth, 0.0, halfHeight), lastPoint);
      lastPoint = writeFlatCorner(destPointStart, 2u, vec3f(-halfWidth, 0.0, -halfHeight), lastPoint);
      lastPoint = writeFlatCorner(destPointStart, 3u, vec3f(halfWidth, 0.0, -halfHeight), lastPoint);
   }
}

fn writeFlatCorner(pointStart:f32, cornerIndex:u32, pos:vec3f, lastPoint:vec4<f32>) -> vec4<f32>{

   let angle = (f32(cornerIndex) + 0.5) * 0.25 * pi_2;
   let pathIndex = u32(round(pointStart)) + cornerIndex;
   var newOverallLength = lastPoint.w;

   if(cornerIndex > 0u){
       newOverallLength += length(pos - lastPoint.xyz);
   }
   
   destPathBuffer[pathIndex].pos = pos;
   destPathBuffer[pathIndex].right = vec3<f32>(cos(angle), 0.0, sin(angle)) * 1.41421;
   destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
   destPathBuffer[pathIndex].pointIndex = f32(cornerIndex);
   destPathBuffer[pathIndex].overallLength = newOverallLength;
   return vec4<f32>(pos, newOverallLength);
}

fn writeRoundCorners(pointStart:f32, destPointCount:f32, progress:f32, offset:vec3f, count:u32, radius:f32, lastPoint0:vec4<f32>) -> vec4<f32>{
   let angleFrom:f32 = pi_2 * progress;
   let pointIndex = pointStart + destPointCount * progress;
   var lastPoint = lastPoint0;

   var newOverallLength = lastPoint.w;
  
   var pos:vec3<f32>;
   var direction:vec3<f32>;

   let angleOffset = pi_2 * 0.25 / f32(count - 1u);
   for(var i:u32 = 0; i < count; i += 1u){
      let angle = f32(i) * angleOffset + angleFrom;
      direction = vec3<f32>(cos(angle), 0.0, sin(angle));
      pos = offset + direction * radius;
      if(progress > 0.00001 || i > 0u ){
         newOverallLength += length(pos - lastPoint.xyz);
      }
      let pathIndex = u32(round(pointIndex + f32(i)));
      destPathBuffer[pathIndex].pos = pos;
      destPathBuffer[pathIndex].right = direction;
      destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
      destPathBuffer[pathIndex].pointIndex = pointIndex - pointStart;
      destPathBuffer[pathIndex].overallLength = newOverallLength;
      lastPoint = vec4<f32>(pos, newOverallLength);
   }
   return lastPoint;
}

`