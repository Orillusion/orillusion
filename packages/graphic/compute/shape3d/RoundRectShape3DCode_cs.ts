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
   drawShapeFace(nodeData, keyPoint, shapeData.useLineWidth, 10.0);
}


fn writeRoundRectPath(nodeData:ShapeData){
   let shapeData:RoundRectShape3D = getRoundRectShape3D(nodeData);
   let keyPointCount = shapeData.base.keyPointCount;
   let keyPointStart = shapeData.base.keyPointStart;
   var halfWidth = shapeData.width * 0.5;
   var halfHeight = shapeData.height * 0.5;
   let segmentCount = u32(round(shapeData.cornerSegment)) + 1u;
   var pathRadius = shapeData.pathRadius;
   let shapeIndex = shapeData.base.shapeIndex;
   if(segmentCount >= 2u){
      writeRoundCorners(keyPointStart, keyPointCount, 0.0, vec3f(halfWidth, 0.0, halfHeight), segmentCount, pathRadius, shapeIndex);
      writeRoundCorners(keyPointStart, keyPointCount, 0.25, vec3f(-halfWidth, 0.0, halfHeight), segmentCount, pathRadius, shapeIndex);
      writeRoundCorners(keyPointStart, keyPointCount, 0.5, vec3f(-halfWidth, 0.0, -halfHeight), segmentCount, pathRadius, shapeIndex);
      writeRoundCorners(keyPointStart, keyPointCount, 0.75, vec3f(halfWidth, 0.0, -halfHeight), segmentCount, pathRadius, shapeIndex);
   }else{
      writeFlatCorner(keyPointStart, 0u, vec3f(halfWidth, 0.0, halfHeight), shapeIndex);
      writeFlatCorner(keyPointStart, 1u, vec3f(-halfWidth, 0.0, halfHeight), shapeIndex);
      writeFlatCorner(keyPointStart, 2u, vec3f(-halfWidth, 0.0, -halfHeight), shapeIndex);
      writeFlatCorner(keyPointStart, 3u, vec3f(halfWidth, 0.0, -halfHeight), shapeIndex);
   }
}

fn writeFlatCorner(pointStart:f32, cornerIndex:u32, pos:vec3f, shapeIndex:f32){
   let angle = (f32(cornerIndex) + 0.5) * 0.25 * pi_2;
   let pathIndex = u32(round(pointStart)) + cornerIndex;
   
   destPathBuffer[pathIndex].pos = pos;
   destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
   destPathBuffer[pathIndex].right = vec3<f32>(cos(angle), 0.0, sin(angle)) * 1.41421;
   destPathBuffer[pathIndex].shapeIndex = shapeIndex;
   destPathBuffer[pathIndex].pointIndex = f32(pathIndex);
}

fn writeRoundCorners(pointStart:f32, keyPointCount:f32, progress:f32, offset:vec3f, count:u32, radius:f32, shapeIndex:f32){
   let angleFrom:f32 = pi_2 * progress;
   let pointIndex = pointStart + keyPointCount * progress;

   let angleOffset = pi_2 * 0.25 / f32(count - 1u);
   for(var i:u32 = 0; i < count; i += 1u){
      let angle = f32(i) * angleOffset + angleFrom;
      var pos = vec3<f32>(cos(angle), 0.0, sin(angle));
      let pathIndex = u32(round(pointIndex + f32(i)));
      destPathBuffer[pathIndex].pos = offset + pos * radius;
      destPathBuffer[pathIndex].right = normalize(pos);
      destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
      destPathBuffer[pathIndex].shapeIndex = shapeIndex;
      destPathBuffer[pathIndex].pointIndex = pointIndex;
   }
}

`