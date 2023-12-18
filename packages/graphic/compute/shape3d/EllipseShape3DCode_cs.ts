export let EllipseShape3DCode_cs = /*wgsl*/`

struct EllipseShape3D {
    base:ShapeDataBase,
    
    rx: f32,
    ry: f32,
    segment: f32,
    d: f32,
    
    e:f32,
    f:f32,
    g:f32,
    h:f32,
 }

fn getEllipseShape3D(node:ShapeData) -> EllipseShape3D{
    return EllipseShape3D(
         node.base,
         node.xa, node.xb, node.xc, node.xd,
         node.xe, node.xf, node.xg, node.xh);
 }
 
fn drawEllipseFace(nodeData:ShapeData, keyPoint:Path3DKeyPoint){
    let shapeData:EllipseShape3D = getEllipseShape3D(nodeData);
    var radius = max(0.0, min(shapeData.rx, shapeData.ry));
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    drawShapeFace(nodeData, keyPoint, lineWidth, 10.0);
}

fn writeEllipsePath(nodeData:ShapeData){
    let shapeData:EllipseShape3D = getEllipseShape3D(nodeData);
    let keyPointCount = shapeData.base.keyPointCount;
    let keyPointStart = shapeData.base.keyPointStart;
    var radius = max(0.0, min(shapeData.rx, shapeData.ry));
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    var rx = shapeData.rx;
    var ry = shapeData.ry;
    if(shapeData.base.line > 0.5){
        rx -= lineWidth * 0.5;
        ry -= lineWidth * 0.5;
    }
    for(var i = 0.0; i < keyPointCount; i += 1.0)
    {
        writeEllipsePoint(i + keyPointStart, shapeData, rx, ry);
    }
}

fn writeEllipsePoint(pointIndex:f32, shapeData:EllipseShape3D, rx:f32, ry:f32)
{
    let pathIndex = u32(round(pointIndex));
    let angle = pi_2 * (pointIndex - shapeData.base.keyPointStart) / shapeData.segment;
    let pos = vec3<f32>(cos(angle), 0.0, sin(angle));
    
    destPathBuffer[pathIndex].pos = vec3<f32>(cos(angle) * rx, 0.0, sin(angle) * ry);
    destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
    destPathBuffer[pathIndex].right = normalize(pos);
    destPathBuffer[pathIndex].shapeIndex = shapeData.base.shapeIndex;
    destPathBuffer[pathIndex].pointIndex = pointIndex;
}

`