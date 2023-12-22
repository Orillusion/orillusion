export let LineShape3DCode_cs = /*wgsl*/`

struct LineShape3D {
    base:ShapeDataBase,
    
    lineJoin: f32,
    corner: f32,
    c: f32,
    d: f32,
    
    e:f32,
    f:f32,
    g:f32,
    h:f32,
 }

fn getLineShape3D(node:ShapeData) -> LineShape3D{
    return LineShape3D(
         node.base,
         node.xa, node.xb, node.xc, node.xd,
         node.xe, node.xf, node.xg, node.xh);
 }
 
fn drawLineFace(nodeData:ShapeData, currentPoint:Path3DKeyPoint){
    let shapeData:LineShape3D = getLineShape3D(nodeData);

    var needDrawLine = nodeData.base.isClosed > 0.5;
    needDrawLine = needDrawLine || round(currentPoint.pointIndex) < round(shapeData.base.destPointCount - 1.0);
    needDrawLine = needDrawLine && nodeData.base.line > 0.5;
    
    let isFirstPointOfShape = round(currentPoint.pointIndex) == 0.0;
    let needDrawArea = shapeData.base.fill > 0.5 && shapeData.base.srcIndexCount > 0.5 && isFirstPointOfShape;
    
    if(needDrawLine){
        drawLineCorner(shapeData, currentPoint);
    }
    if(needDrawArea){
        drawLineFilledArea(shapeData);
    }
}

fn drawLineFilledArea(shapeData:LineShape3D){
    let baseData = shapeData.base;
    let uvScale:vec2<f32> = vec2<f32>(baseData.uScale, baseData.vScale);

    var p0:vec3f;
    var p1:vec3f;
    var p2:vec3f;
    var p3:vec3f;
    
    var u0:vec2f;
    var u1:vec2f;
    var u2:vec2f;

    let srcIndexStart = u32(round(baseData.srcIndexStart));
    let srcIndexCount = u32(round(baseData.srcIndexCount));
    let triangleCount = srcIndexCount / 3u;

    let pointStart = u32(round(baseData.srcPointStart));

    for(var i = 0u; i < triangleCount; i += 1u){
        let indecies:vec4<u32> = srcIndexBuffer[srcIndexStart + i];
        let i0 = indecies.x + pointStart;
        let i1 = indecies.y + pointStart;
        let i2 = indecies.z + pointStart;

        p0 = srcPathBuffer[i0].xyy;
        p1 = srcPathBuffer[i1].xyy;
        p2 = srcPathBuffer[i2].xyy;

        p0.y = fillOffsetY;
        p1.y = fillOffsetY;
        p2.y = fillOffsetY;

        u0 = vec2f(p0.x, p0.z) * uvScale;
        u1 = vec2f(p1.x, p1.z) * uvScale;
        u2 = vec2f(p2.x, p2.z) * uvScale;
    
        drawFace(shapeIndex,p1,p0,p2,u1,u0,u2);
    }

}

fn drawLineCorner(shapeData:LineShape3D, currentPoint:Path3DKeyPoint){
    var p0:vec3f;
    var p1:vec3f;
    var p2:vec3f;
    var p3:vec3f;
    
    var u0:vec2f;
    var u1:vec2f;
    var u2:vec2f;

    let baseData = shapeData.base;
 
    let destStart = u32(round(baseData.destPointStart));
    let destCount = u32(round(baseData.destPointCount));
    let pointIndex = u32(round(currentPoint.pointIndex));

    var nextPointIndex:u32 = pointIndex + 1u;
    if(nextPointIndex >= destCount){
        nextPointIndex = 0u;
    }

    nextPointIndex += destStart;
    let nextPoint:Path3DKeyPoint = destPathBuffer[nextPointIndex];

    if(baseData.line > 0.5) {
        let lineJoin = u32(round(shapeData.lineJoin));
        var useCorner = 0u;
        if(lineJoin == 0){ useCorner = 1u;}
        else if(lineJoin == 1){ useCorner = 0u;}
        else {
            useCorner = u32(round(shapeData.corner));
            useCorner = max(2u, useCorner);
        }

        //0-1
        //2-3
        let halfLineWidth = shapeData.base.lineWidth * 0.5;
        var p0 = currentPoint.pos - currentPoint.right * halfLineWidth;
        var p1 = currentPoint.pos + currentPoint.right * halfLineWidth;
    
        var p2 = nextPoint.pos - currentPoint.right * halfLineWidth;
        var p3 = nextPoint.pos + currentPoint.right * halfLineWidth;
        
        let u0 = vec2f(0.5, 0.5);
    
        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        drawFace(shapeIndex,p1,p0,p2,u0,u0,u0);
        drawFace(shapeIndex,p1,p2,p3,u0,u0,u0);

        switch(useCorner){
            case 0u:
            {
                drawLineCornerMiter(shapeData, currentPoint, nextPoint);
                break;
            }
            case 1u:
            {
                drawLineCornerBevel(shapeData, currentPoint, nextPoint);
                break;
            }
            default:
            {
                drawLineCornerRound(shapeData, currentPoint, nextPoint, useCorner);
                break;
            }
        }
    }
 }

fn drawLineCornerMiter(shapeData:LineShape3D, currentPoint:Path3DKeyPoint, nextPoint:Path3DKeyPoint){
    let isClosed:bool = shapeData.base.isClosed > 0.5;
    let isEndPoint:bool = currentPoint.pointIndex + 2.5 > shapeData.base.srcPointCount;
    
    //miter
    if(isClosed || !isEndPoint){
        let u0:vec2f = vec2f(0.5, 0.5);
        let halfLineWidth = shapeData.base.lineWidth * 0.5;
        let cornerAngle = acos(dot(currentPoint.right, nextPoint.right)) * 0.5;
        let edgeLength = halfLineWidth / cos(cornerAngle);
        let cornerRight = normalize(currentPoint.right + nextPoint.right);
        let isPositive = cross(currentPoint.right, nextPoint.right).y >= 0.0;
        
        var p0 = nextPoint.pos;
        var p1:vec3f;
        var p2:vec3f;
        var p3:vec3f;
        if(isPositive){
            p1 = nextPoint.pos - cornerRight * edgeLength;
            p2 = nextPoint.pos - currentPoint.right * halfLineWidth;
            p3 = nextPoint.pos - nextPoint.right * halfLineWidth;
        }else{
            p1 = nextPoint.pos + cornerRight * edgeLength;
            p2 = nextPoint.pos + nextPoint.right * halfLineWidth;
            p3 = nextPoint.pos + currentPoint.right * halfLineWidth;
        }

        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        drawFace(shapeIndex,p0,p1,p3,u0,u0,u0);
        drawFace(shapeIndex,p0,p2,p1,u0,u0,u0);
    }
    
}

fn drawLineCornerBevel(shapeData:LineShape3D, currentPoint:Path3DKeyPoint, nextPoint:Path3DKeyPoint){
    let isClosed:bool = shapeData.base.isClosed > 0.5;
    let isEndPoint:bool = currentPoint.pointIndex + 2.5 > shapeData.base.srcPointCount;
    
    //miter
    if(isClosed || !isEndPoint){
        let u0:vec2f = vec2f(0.5, 0.5);
        let halfLineWidth = shapeData.base.lineWidth * 0.5;
        let cornerAngle = acos(dot(currentPoint.right, nextPoint.right)) * 0.5;
        let edgeLength = halfLineWidth / cos(cornerAngle);
        let cornerRight = normalize(currentPoint.right + nextPoint.right);
        let isPositive = cross(currentPoint.right, nextPoint.right).y >= 0.0;
        
        var p0 = nextPoint.pos;
        var p1:vec3f;
        var p2:vec3f;
        var p3:vec3f;

        if(isPositive){
            //p1 = nextPoint.pos - cornerRight * edgeLength;
            p2 = nextPoint.pos - currentPoint.right * halfLineWidth;
            p3 = nextPoint.pos - nextPoint.right * halfLineWidth;
        }else{
            //p1 = nextPoint.pos + cornerRight * edgeLength;
            p2 = nextPoint.pos + nextPoint.right * halfLineWidth;
            p3 = nextPoint.pos + currentPoint.right * halfLineWidth;
        }

        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        drawFace(shapeIndex,p0,p2,p3,u0,u0,u0);
    }
}


fn drawLineCornerRound(shapeData:LineShape3D, currentPoint:Path3DKeyPoint, nextPoint:Path3DKeyPoint, useCorner:u32){

    let isClosed:bool = shapeData.base.isClosed > 0.5;
    let isEndPoint:bool = currentPoint.pointIndex + 2.5 > shapeData.base.srcPointCount;
    
    //miter
    if(isClosed || !isEndPoint){
        let u0:vec2f = vec2f(0.5, 0.5);
        let halfLineWidth = shapeData.base.lineWidth * 0.5;
        let isPositive = cross(currentPoint.right, nextPoint.right).y >= 0.0;
        let cornerAngle = acos(dot(currentPoint.right, nextPoint.right)) ;
        let rotateMat = buildRotateYMat3(cornerAngle / f32(useCorner));
        var p0 = nextPoint.pos;
        var p1:vec3f;
        var p2:vec3f;
        var p3:vec3f;

        var rotateFrom:vec3<f32>;
        if(isPositive){
            rotateFrom = -nextPoint.right;
        }else{
            rotateFrom = currentPoint.right;
        }

        for(var i = 0u; i < useCorner; i ++){
            p3 = nextPoint.pos + rotateFrom * halfLineWidth;
            rotateFrom = rotateMat * rotateFrom;
            p2 = nextPoint.pos + rotateFrom * halfLineWidth;

            p0.y = lineOffsetY;
            p1.y = lineOffsetY;
            p2.y = lineOffsetY;
            p3.y = lineOffsetY;

            drawFace(shapeIndex,p0,p2,p3,u0,u0,u0);
        }
        
    }
}


fn writeLinePath(nodeData:ShapeData){
    let shapeData:LineShape3D = getLineShape3D(nodeData);
    let shapeBase = shapeData.base;
    let destPointCount = shapeBase.destPointCount;
    let destPointStart = u32(round(shapeBase.destPointStart));
    let srcPointCount = u32(round(shapeBase.srcPointCount));
    let srcPointStart = shapeBase.srcPointStart;

    var currentPoint:vec3<f32>;
    var nextPoint:vec3<f32>;
    var lastPoint:vec3<f32>;

    var lastRight:vec3<f32>;

    var right:vec3<f32>;
    var up = vec3<f32>(0.0, 1.0, 0.0);
    var forward:vec3<f32>;

    var curSrcIndex:u32 = u32(round(srcPointStart));
    var curDestIndex:u32 = destPointStart;

    currentPoint = srcPathBuffer[curSrcIndex].xyy;
    currentPoint.y = 0.0;
    let firstPoint = currentPoint;

    lastPoint = srcPathBuffer[srcPointCount - 1].xyy;
    lastPoint.y = 0.0;

    forward = normalize(currentPoint - lastPoint);
    lastRight = cross(up, forward);

    for(var i = 0u; i < srcPointCount; i += 1u)
    {
        nextPoint = srcPathBuffer[curSrcIndex + 1u].xyz;
        nextPoint.z = nextPoint.y;
        nextPoint.y = 0.0;

        if(i == 0u){
            //start
            forward = normalize(nextPoint - currentPoint);
            right = cross(up, forward);
        }else if(i + 1u == srcPointCount){
            //end
            if(shapeBase.isClosed > 0.0){
                forward = normalize(firstPoint - currentPoint);
                right = cross(up, forward);
            }else{
                right = lastRight;
            }
        }else{
            //center
            forward = normalize(nextPoint - currentPoint);
            right = cross(up, forward);
        }

        writeLinePoint(curDestIndex, shapeData, currentPoint, right, f32(i));
        lastRight = right;

        lastPoint = currentPoint;
        currentPoint = nextPoint;
        curSrcIndex += 1u;
        curDestIndex += 1u;
    }
}

fn writeLinePoint(pointIndex:u32, shapeData:LineShape3D, pos:vec3<f32>, right:vec3<f32>, localPointIndex:f32)
{
    let pathIndex = pointIndex;
    destPathBuffer[pathIndex].pos = pos;
    destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
    destPathBuffer[pathIndex].right = right;
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
}

`