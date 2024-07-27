/**
 * @internal
 */
export let EllipseShape3DCode_cs = /*wgsl*/`

struct EllipseShape3D {
    base:ShapeDataBase,
    
    rx: f32,
    ry: f32,
    segment: f32,
    rotation: f32,
    
    startAngle: f32,
    endAngle: f32,
    arcType:f32,
    a:f32,
 }

fn getEllipseShape3D(node:ShapeData) -> EllipseShape3D{
    return EllipseShape3D(
         node.base,
         node.xa, node.xb, node.xc, node.xd,
         node.xe, node.xf, node.xg, node.xh);
 }
 
fn drawEllipseFace(nodeData:ShapeData, keyPoint:Path3DKeyPoint){
    let shapeData:EllipseShape3D = getEllipseShape3D(nodeData);
    let baseData = nodeData.base;
    var radius = max(0.0, min(shapeData.rx, shapeData.ry));
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
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

fn writeEllipsePath(nodeData:ShapeData){
    let shapeData:EllipseShape3D = getEllipseShape3D(nodeData);
    let baseData = shapeData.base;
    let destPointCount = baseData.destPointCount;
    let destPointStart = baseData.destPointStart;
    var radius = max(0.0, min(shapeData.rx, shapeData.ry));
    var lineWidth = min(nodeData.base.lineWidth, radius * 2.0);
    var rx = shapeData.rx;
    var ry = shapeData.ry;
    if(baseData.line > 0.5){
        rx -= lineWidth * 0.5;
        ry -= lineWidth * 0.5;
    }
    var rotateMat:mat3x3<f32> = buildRotateYMat3(shapeData.rotation);
    var lastPoint:vec4<f32>;
    for(var i = 0.0; i < destPointCount; i += 1.0)
    {
        lastPoint = writeEllipsePoint(i + destPointStart, shapeData, rx, ry, rotateMat, i, lastPoint);
    }
}

fn writeEllipsePoint(pointIndex:f32, shapeData:EllipseShape3D, rx:f32, ry:f32, rotation:mat3x3<f32>, localPointIndex:f32, lastPoint:vec4<f32>) -> vec4<f32>
{
    let pathIndex = u32(round(pointIndex));
    // let angle = pi_2 * (pointIndex - shapeData.base.destPointStart) / shapeData.segment;
    let t = (pointIndex - shapeData.base.destPointStart) / shapeData.segment;
    let angle = pi_2 * mix(shapeData.startAngle, shapeData.endAngle, t) / 360.0;
    

    let pos = rotation * vec3<f32>(cos(angle) * rx, 0.0, sin(angle) * ry);
    let deltaPos = rotation * vec3<f32>(cos(angle + 0.01) * rx, 0.0, sin(angle + 0.01) * ry);
    let up = vec3<f32>(0.0, 1.0, 0.0);

    var newOverallLength = lastPoint.w;
    if(localPointIndex > 0.0){
        newOverallLength += length(pos - lastPoint.xyz);
    }
    destPathBuffer[pathIndex].pos = pos;
    destPathBuffer[pathIndex].right = normalize(cross(up, normalize(deltaPos - pos)));
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
    destPathBuffer[pathIndex].overallLength = newOverallLength;

    return vec4<f32>(pos, newOverallLength);
}

`