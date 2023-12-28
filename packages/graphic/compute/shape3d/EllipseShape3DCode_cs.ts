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
    drawShapeFace(nodeData, keyPoint, lineWidth);
}

fn writeEllipsePath(nodeData:ShapeData){
    let shapeData:EllipseShape3D = getEllipseShape3D(nodeData);
    let shapeBase = shapeData.base;
    let destPointCount = shapeBase.destPointCount;
    let destPointStart = shapeBase.destPointStart;
    var radius = max(0.0, min(shapeData.rx, shapeData.ry));
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    var rx = shapeData.rx;
    var ry = shapeData.ry;
    if(shapeBase.line > 0.5){
        rx -= lineWidth * 0.5;
        ry -= lineWidth * 0.5;
    }
    var lastPoint:vec4<f32>;
    for(var i = 0.0; i < destPointCount; i += 1.0)
    {
        lastPoint = writeEllipsePoint(i + destPointStart, shapeData, rx, ry, i, lastPoint);
    }
}

fn writeEllipsePoint(pointIndex:f32, shapeData:EllipseShape3D, rx:f32, ry:f32, localPointIndex:f32, lastPoint:vec4<f32>) -> vec4<f32>
{
    let pathIndex = u32(round(pointIndex));
    let angle = pi_2 * (pointIndex - shapeData.base.destPointStart) / shapeData.segment;
    let pos = vec3<f32>(cos(angle) * rx, 0.0, sin(angle) * ry);
    let deltaPos = vec3<f32>(cos(angle + 0.01) * rx, 0.0, sin(angle + 0.01) * ry);
    let up = vec3<f32>(0.0, 1.0, 0.0);

    var newOverallLength = lastPoint.w;
    if(localPointIndex > 0.0){
        newOverallLength += length(pos - lastPoint.xyz);
    }
    destPathBuffer[pathIndex].pos = pos;
    destPathBuffer[pathIndex].up = up;
    destPathBuffer[pathIndex].right = normalize(cross(up, normalize(deltaPos - pos)));
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
    destPathBuffer[pathIndex].overallLength = newOverallLength;

    return vec4<f32>(pos, newOverallLength);
}

`