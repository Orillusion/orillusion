/**
 * @internal
 */
export let CircleShape3DCode_cs = /*wgsl*/`

struct CircleShape3D {
    base:ShapeDataBase,
    
    radius: f32,
    segment: f32,
    startAngle: f32,
    endAngle: f32,
    
    arcType:f32,
    a:f32,
    b:f32,
    c:f32,
 }

fn getCircleShape3D(node:ShapeData) -> CircleShape3D{
    return CircleShape3D(
         node.base,
         node.xa, node.xb, node.xc, node.xd,
         node.xe, node.xf, node.xg, node.xh);
 }
 
fn drawCircleFace(nodeData:ShapeData, keyPoint:Path3DKeyPoint){
    let shapeData:CircleShape3D = getCircleShape3D(nodeData);
    var radius = max(0.0, shapeData.radius);
    let baseData = nodeData.base;
    var lineWidth = min(baseData.lineWidth, radius * 2.0);
    let needDraw = round(baseData.destPointCount) > round(keyPoint.pointIndex + 1.0);
    if(needDraw){
        var cPoint:vec3f = zero_pos;
        if(u32(round(shapeData.arcType)) == 1u){
            let destStart = u32(round(baseData.destPointStart));
            let destEnd = destStart + u32(round(baseData.destPointCount)) - 1u;
            let startPoint:Path3DKeyPoint = destPathBuffer[destStart];
            let endPoint:Path3DKeyPoint = destPathBuffer[destEnd];
            cPoint = (startPoint.pos + endPoint.pos) * 0.5;
        }
        drawShapeFace(nodeData, keyPoint, lineWidth, cPoint);
    }
}

fn writeCirclePath(nodeData:ShapeData){
    let shapeData:CircleShape3D = getCircleShape3D(nodeData);
    let baseData = shapeData.base;
    let destPointCount = baseData.destPointCount;
    let destPointStart = baseData.destPointStart;
    var radius = max(0.0, shapeData.radius);
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    if(baseData.line > 0.5){
        radius -= lineWidth * 0.5;
    }
    var lastPoint:vec4<f32>;
    for(var i = 0.0; i < destPointCount; i += 1.0)
    {
        lastPoint = writeCirclePoint(i + destPointStart, shapeData, radius, i, lastPoint);
    }
}

fn writeCirclePoint(pointIndex:f32, shapeData:CircleShape3D, radius:f32, localPointIndex:f32, lastPoint:vec4<f32>) -> vec4<f32>
{
    let pathIndex = u32(round(pointIndex));
    let t = (pointIndex - shapeData.base.destPointStart) / shapeData.segment;
    let angle = pi_2 * mix(shapeData.startAngle, shapeData.endAngle, t) / 360.0;
    
    let right = vec3<f32>(cos(angle), 0.0, sin(angle));
    let pos = right * radius;
    var newOverallLength = lastPoint.w;
    if(localPointIndex > 0.0){
        newOverallLength += length(pos - lastPoint.xyz);
    }
    destPathBuffer[pathIndex].pos = pos;
    destPathBuffer[pathIndex].right = right;
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
    destPathBuffer[pathIndex].overallLength = newOverallLength;
    return vec4<f32>(pos, newOverallLength);
}

`