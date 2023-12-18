export let CircleShape3DCode_cs = /*wgsl*/`

struct CircleShape3D {
    base:ShapeDataBase,
    
    radius: f32,
    segment: f32,
    c: f32,
    d: f32,
    
    e:f32,
    f:f32,
    g:f32,
    h:f32,
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
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    drawShapeFace(nodeData, keyPoint, lineWidth, 10.0);
}

fn writeCirclePath(nodeData:ShapeData){
    let shapeData:CircleShape3D = getCircleShape3D(nodeData);
    let keyPointCount = shapeData.base.keyPointCount;
    let keyPointStart = shapeData.base.keyPointStart;
    var radius = max(0.0, shapeData.radius);
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    if(shapeData.base.line > 0.5){
        radius -= lineWidth * 0.5;
    }
    for(var i = 0.0; i < keyPointCount; i += 1.0)
    {
        writeCirclePoint(i + keyPointStart, shapeData, radius);
    }
}

fn writeCirclePoint(pointIndex:f32, shapeData:CircleShape3D, radius:f32)
{
    let pathIndex = u32(round(pointIndex));
    let angle = pi_2 * (pointIndex - shapeData.base.keyPointStart) / shapeData.segment;
    let pos = vec3<f32>(cos(angle), 0.0, sin(angle));
    
    destPathBuffer[pathIndex].pos = pos * radius;
    destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
    destPathBuffer[pathIndex].right = normalize(pos);
    destPathBuffer[pathIndex].shapeIndex = shapeData.base.shapeIndex;
    destPathBuffer[pathIndex].pointIndex = pointIndex;
}

`