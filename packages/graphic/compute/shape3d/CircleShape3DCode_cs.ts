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
    drawShapeFace(nodeData, keyPoint, lineWidth, vec2<f32>(nodeData.base.uScale, nodeData.base.vScale));
}

fn writeCirclePath(nodeData:ShapeData){
    let shapeData:CircleShape3D = getCircleShape3D(nodeData);
    let shapeBase = shapeData.base;
    let destPointCount = shapeBase.destPointCount;
    let destPointStart = shapeBase.destPointStart;
    var radius = max(0.0, shapeData.radius);
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    if(shapeBase.line > 0.5){
        radius -= lineWidth * 0.5;
    }
    for(var i = 0.0; i < destPointCount; i += 1.0)
    {
        writeCirclePoint(i + destPointStart, shapeData, radius, i);
    }
}

fn writeCirclePoint(pointIndex:f32, shapeData:CircleShape3D, radius:f32, localPointIndex:f32)
{
    let pathIndex = u32(round(pointIndex));
    let angle = pi_2 * (pointIndex - shapeData.base.destPointStart) / shapeData.segment;
    let pos = vec3<f32>(cos(angle), 0.0, sin(angle));
    
    destPathBuffer[pathIndex].pos = pos * radius;
    destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
    destPathBuffer[pathIndex].right = normalize(pos);
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
}

`