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
    let baseData = nodeData.base;
    let isFirstPointOfShape = round(currentPoint.pointIndex) == 0.0;
    
    if(baseData.fill > 0.5 && baseData.srcIndexCount > 0.5 && isFirstPointOfShape){
        drawLineFilledArea(shapeData);
    }

    if(baseData.line > 0.5){
        let isLastPointOfShape = round(currentPoint.pointIndex) == round(baseData.destPointCount - 1.0);
        if(baseData.isClosed < 0.5){
            if(isFirstPointOfShape){
                drawLineStart(shapeData, currentPoint);
            }else if(isLastPointOfShape){
                drawLineEnd(shapeData, currentPoint);
            }else{
                drawLineCorner(shapeData, currentPoint);
            }
        }else{
            drawLineCorner(shapeData, currentPoint);
        }
    }
    
}

fn drawLineStart(shapeData:LineShape3D, currentPoint:Path3DKeyPoint){
    let baseData = shapeData.base;
 
    let destStart = u32(round(baseData.destPointStart));
    let halfLineWidth = shapeData.base.lineWidth * 0.5;

    let nextPoint:Path3DKeyPoint = destPathBuffer[1u + destStart];
    var p0 = currentPoint.pos - currentPoint.right * halfLineWidth;
    var p1 = currentPoint.pos + currentPoint.right * halfLineWidth;
    let deltaPos = (nextPoint.pos - currentPoint.pos) * 0.5;
    let segmentLength = length(deltaPos);
    var p2 = p0 + deltaPos;
    var p3 = p1 + deltaPos;

    p0.y = lineOffsetY;
    p1.y = lineOffsetY;
    p2.y = lineOffsetY;
    p3.y = lineOffsetY;

    let u0 = vec2f(0.0, 0.0);
    let u1 = vec2f(1.0, 0.0);
    let u2 = vec2f(0.0, segmentLength);
    let u3 = vec2f(1.0, segmentLength);

    drawLine(shapeIndex,p1,p0,p2,u1,u0,u2);
    drawLine(shapeIndex,p1,p2,p3,u1,u2,u3);
}

fn drawLineEnd(shapeData:LineShape3D, currentPoint:Path3DKeyPoint){
    let baseData = shapeData.base;
 
    let destStart = u32(round(baseData.destPointStart));
    let pointIndex = u32(round(currentPoint.pointIndex));
    
    let lastPoint:Path3DKeyPoint = destPathBuffer[pointIndex - 1u + destStart];
    let halfLineWidth = shapeData.base.lineWidth * 0.5;

    var p0 = currentPoint.pos - currentPoint.right * halfLineWidth;
    var p1 = currentPoint.pos + currentPoint.right * halfLineWidth;
    let deltaPos = (lastPoint.pos - currentPoint.pos) * 0.5;
    
    var p2 = p0 + deltaPos;
    var p3 = p1 + deltaPos;

    p0.y = lineOffsetY;
    p1.y = lineOffsetY;
    p2.y = lineOffsetY;
    p3.y = lineOffsetY;
    
    let halfLength = length(deltaPos);
    var tempV = lastPoint.overallLength + halfLength;

    let u2 = vec2f(0.0, tempV);
    let u3 = vec2f(1.0, tempV);
    let u0 = vec2f(0.0, tempV + halfLength);
    let u1 = vec2f(1.0, tempV + halfLength);

    drawLine(shapeIndex,p1,p2,p0,u1,u2,u0);
    drawLine(shapeIndex,p1,p3,p2,u1,u3,u2);
}

fn drawLineFilledArea(shapeData:LineShape3D){
    let baseData = shapeData.base;

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

    let pointStart = u32(round(baseData.destPointStart));

    for(var i = 0u; i < triangleCount; i += 1u){
        let indecies:vec4<u32> = srcIndexBuffer[srcIndexStart + i];
        let i0 = indecies.x + pointStart;
        let i1 = indecies.y + pointStart;
        let i2 = indecies.z + pointStart;

        p0 = destPathBuffer[i0].pos;
        p1 = destPathBuffer[i1].pos;
        p2 = destPathBuffer[i2].pos;

        p0.y = fillOffsetY;
        p1.y = fillOffsetY;
        p2.y = fillOffsetY;

        u0 = vec2f(p0.x, p0.z);
        u1 = vec2f(p1.x, p1.z);
        u2 = vec2f(p2.x, p2.z);
    
        drawFace(shapeIndex,p1,p0,p2,u1,u0,u2);
    }
}

fn drawLineCorner(shapeData:LineShape3D, currentPoint:Path3DKeyPoint){
    var u0:vec2f;
    var u1:vec2f;
    var u2:vec2f;
    var u3:vec2f;
    var u4:vec2f;
    var u5:vec2f;
    var u6:vec2f;

    var p0:vec3f;
    var p1:vec3f;
    var p2:vec3f;
    var p3:vec3f;
    var p4:vec3f;
    var p5:vec3f;
    var p6:vec3f;

    let baseData = shapeData.base;
 
    let destStart = u32(round(baseData.destPointStart));
    let destCount = u32(round(baseData.destPointCount));
    let pointIndex = u32(round(currentPoint.pointIndex));

    var nextPointIndex:u32 = pointIndex + 1u;
    if(nextPointIndex >= destCount){
        nextPointIndex = 0u;
    }
    var lastPointIndex:u32 = destCount - 1u;
    if(pointIndex > 0u){
        lastPointIndex = pointIndex - 1u;
    }

    let lineJoin = u32(round(shapeData.lineJoin));
    var cornerPointExt = 0u;
    if(lineJoin == 0){ cornerPointExt = 1u;}
    else if(lineJoin == 1){ cornerPointExt = 0u;}
    else {
        cornerPointExt = u32(round(shapeData.corner));
        cornerPointExt = clamp(cornerPointExt, 2u, 8u);
    }

    nextPointIndex += destStart;
    lastPointIndex += destStart;

    let nextPoint:Path3DKeyPoint = destPathBuffer[nextPointIndex];
    let lastPoint:Path3DKeyPoint = destPathBuffer[lastPointIndex];
    let halfLineWidth = shapeData.base.lineWidth * 0.5;
    let isPositive = cross(lastPoint.right, currentPoint.right).y >= 0.0;
    let cornerAngle = acos(dot(lastPoint.right, currentPoint.right)) * 0.5;
    let edgeLength = halfLineWidth / cos(cornerAngle);
    let cornerRight = normalize(lastPoint.right + currentPoint.right);
    let cornerLength = tan(cornerAngle) * halfLineWidth;

    var cornerUVLength = 0f;//corner cost uv length
    if(cornerPointExt == 0u){
        cornerUVLength = cornerLength;
    }else if(cornerPointExt == 1u){
        cornerUVLength = halfLineWidth * sin(cornerAngle);
        // cornerUVLength = halfLineWidth * sin(cornerAngle);
    }else if(cornerPointExt > 1u){
        cornerUVLength = halfLineWidth * cornerAngle;
    }
    
    //prev half segment
    let halfDis_Last_Current = length(currentPoint.pos - lastPoint.pos) * 0.5;
    let lastCenterCoord = (currentPoint.pos + lastPoint.pos) * 0.5;
    let lastLengthUVRatio = halfDis_Last_Current / (cornerUVLength + halfDis_Last_Current);

    var tempV:f32 = lastPoint.overallLength;
    if(halfDis_Last_Current > cornerLength){
        p0 = lastCenterCoord - lastPoint.right * halfLineWidth;
        p1 = lastCenterCoord + lastPoint.right * halfLineWidth;
    
        p2 = currentPoint.pos - lastPoint.right * halfLineWidth;
        p3 = currentPoint.pos + lastPoint.right * halfLineWidth;

        let deltaPos = normalize(lastCenterCoord - currentPoint.pos) * cornerLength;
        p2 = p2 + deltaPos;
        p3 = p3 + deltaPos;

        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        u0 = vec2f(0.0, lastPoint.overallLength + halfDis_Last_Current);
        u1 = vec2f(1.0, lastPoint.overallLength + halfDis_Last_Current);
        tempV = lastPoint.overallLength + 2.0 * halfDis_Last_Current - (cornerLength + cornerUVLength) * lastLengthUVRatio;
        u2 = vec2f(0.0, tempV);
        u3 = vec2f(1.0, tempV);
        drawLine(shapeIndex,p1,p0,p2,u1,u0,u2);
        drawLine(shapeIndex,p1,p2,p3,u1,u2,u3);
    }

    //next half segment
     let halfDis_Current_Next = length(currentPoint.pos - nextPoint.pos) * 0.5;
     let nextCenterCoord = (currentPoint.pos + nextPoint.pos) * 0.5;
     let nextLengthUVRatio = halfDis_Current_Next / (cornerUVLength + halfDis_Current_Next);
     
     if(halfDis_Current_Next > cornerLength){
        p0 = nextCenterCoord - currentPoint.right * halfLineWidth;
        p1 = nextCenterCoord + currentPoint.right * halfLineWidth;
   
        p2 = currentPoint.pos - currentPoint.right * halfLineWidth;
        p3 = currentPoint.pos + currentPoint.right * halfLineWidth;

        let deltaPos = normalize(nextCenterCoord - currentPoint.pos) * cornerLength;
        p2 = p2 + deltaPos;
        p3 = p3 + deltaPos;

        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        u0 = vec2f(0.0, currentPoint.overallLength + halfDis_Current_Next);
        u1 = vec2f(1.0, currentPoint.overallLength + halfDis_Current_Next);
        u2 = vec2f(0.0, currentPoint.overallLength + (cornerLength + cornerUVLength) * nextLengthUVRatio);
        u3 = vec2f(1.0, currentPoint.overallLength + (cornerLength + cornerUVLength) * nextLengthUVRatio);

        drawLine(shapeIndex,p1,p2,p0,u1,u2,u0);
        drawLine(shapeIndex,p1,p3,p2,u1,u3,u2);
    }

    //__________________________trapezoid start
    p0 = currentPoint.pos;
    let lastTrapezoidHeight = min(cornerLength, halfDis_Last_Current);
    let nextTrapezoidHeight = min(cornerLength, halfDis_Current_Next);

    let lastTrapezoidT = lastTrapezoidHeight/cornerLength + 1.0;
    let nextTrapezoidT = nextTrapezoidHeight/cornerLength + 1.0;

    if(isPositive){
        //prev
        p1 = currentPoint.pos - cornerRight * edgeLength;
        p2 = currentPoint.pos - lastPoint.right * halfLineWidth;
        p3 = currentPoint.pos - currentPoint.right * halfLineWidth;
        
        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        tempV = lastPoint.overallLength + 2.0 * halfDis_Last_Current - (cornerUVLength + lastTrapezoidHeight) * lastLengthUVRatio;

        u0 = vec2f(0.5, tempV + lastTrapezoidHeight * lastLengthUVRatio);
        u2 = vec2f(0.0, tempV + lastTrapezoidHeight * lastLengthUVRatio);
        u4 = vec2f(lastTrapezoidT * 0.5, tempV);
        u5 = vec2f(0.0, tempV);

        p4 = mix(p1, p0, lastTrapezoidT);
        p5 = mix(p1, p2, lastTrapezoidT);
        drawLine(shapeIndex,p0,p4,p5,u0,u4,u5);
        drawLine(shapeIndex,p0,p5,p2,u0,u5,u2);

        //next
        p4 = mix(p1, p0, nextTrapezoidT);
        p6 = mix(p1, p3, nextTrapezoidT);

        tempV = currentPoint.overallLength + cornerUVLength * nextLengthUVRatio;
        u0 = vec2f(0.5, tempV);
        u3 = vec2f(0.0, tempV);
        u4 = vec2f(lastTrapezoidT * 0.5, tempV + nextTrapezoidHeight * nextLengthUVRatio);
        u6 = vec2f(0.0, tempV + nextTrapezoidHeight * nextLengthUVRatio);

        drawLine(shapeIndex,p0,p3,p6,u0,u3,u6);
        drawLine(shapeIndex,p0,p6,p4,u0,u6,u4);
    }else{
        //next
        p1 = currentPoint.pos + cornerRight * edgeLength;
        p2 = currentPoint.pos + currentPoint.right * halfLineWidth;
        p3 = currentPoint.pos + lastPoint.right * halfLineWidth;

        p0.y = lineOffsetY;
        p1.y = lineOffsetY;
        p2.y = lineOffsetY;
        p3.y = lineOffsetY;

        p4 = mix(p1, p0, nextTrapezoidT);
        p5 = mix(p1, p2, nextTrapezoidT);

        tempV = currentPoint.overallLength + cornerUVLength * nextLengthUVRatio;
        u0 = vec2f(0.5, tempV);
        u2 = vec2f(1.0, tempV);
        tempV += nextTrapezoidHeight * nextLengthUVRatio;
        u4 = vec2f(1.0 - nextTrapezoidT * 0.5, tempV);
        u5 = vec2f(1.0, tempV);


        drawLine(shapeIndex,p0,p4,p5,u0,u4,u5);
        drawLine(shapeIndex,p0,p5,p2,u0,u5,u2);

        //pre
        p4 = mix(p1, p0, lastTrapezoidT);
        p6 = mix(p1, p3, lastTrapezoidT);

        tempV = lastPoint.overallLength + 2.0 * halfDis_Last_Current - cornerUVLength * lastLengthUVRatio;
        u0 = vec2f(0.5, tempV);
        u3 = vec2f(1.0, tempV);
        tempV -= lastTrapezoidHeight * lastLengthUVRatio;
        u4 = vec2f(1.0 - lastTrapezoidT * 0.5, tempV);
        u6 = vec2f(1.0, tempV);

        drawLine(shapeIndex,p0,p3,p6,u0,u3,u6);
        drawLine(shapeIndex,p0,p6,p4,u0,u6,u4);
    }

    //__________________________trapezoid end

    //__________________________corner triangle start

    switch(cornerPointExt){
        case 0u://miter
        {
            p0 = currentPoint.pos;
            if(isPositive){
                p1 = currentPoint.pos - cornerRight * edgeLength;
                p2 = currentPoint.pos - lastPoint.right * halfLineWidth;
                p3 = currentPoint.pos - currentPoint.right * halfLineWidth;

                p0.y = lineOffsetY;
                p1.y = lineOffsetY;
                p2.y = lineOffsetY;
                p3.y = lineOffsetY;
                //prev
                tempV = lastPoint.overallLength + 2.0 * halfDis_Last_Current - cornerUVLength * lastLengthUVRatio;
                u0 = vec2f(0.5, tempV);
                u1 = vec2f(0.0, tempV + cornerUVLength * lastLengthUVRatio);
                u2 = vec2f(0.0, tempV);
                drawLine(shapeIndex,p0,p2,p1,u0,u2,u1);

                //next
                tempV = currentPoint.overallLength;
                u0 = vec2f(0.5, tempV + cornerUVLength * nextLengthUVRatio);
                u1 = vec2f(0.0, tempV);
                u3 = vec2f(0.0, tempV + cornerUVLength * nextLengthUVRatio);
                drawLine(shapeIndex,p0,p1,p3,u0,u1,u3);
            }else{
                p1 = currentPoint.pos + cornerRight * edgeLength;
                p2 = currentPoint.pos + currentPoint.right * halfLineWidth;
                p3 = currentPoint.pos + lastPoint.right * halfLineWidth;

                p0.y = lineOffsetY;
                p1.y = lineOffsetY;
                p2.y = lineOffsetY;
                p3.y = lineOffsetY;
                //prev
                tempV = lastPoint.overallLength + 2.0 * halfDis_Last_Current - cornerUVLength * lastLengthUVRatio;
                u0 = vec2f(0.5, tempV);
                u1 = vec2f(1.0, tempV + cornerUVLength * lastLengthUVRatio);
                u3 = vec2f(1.0, tempV);
                drawLine(shapeIndex,p0,p1,p3,u0,u1,u3);

                //next
                tempV = currentPoint.overallLength;
                u0 = vec2f(0.5, tempV + cornerUVLength * nextLengthUVRatio);
                u1 = vec2f(1.0, tempV);
                u2 = vec2f(1.0, tempV + cornerUVLength * nextLengthUVRatio);
                drawLine(shapeIndex,p0,p2,p1,u0,u2,u1);
            }
            break;
        }
        case 1u://bevel
        {
            p0 = currentPoint.pos;
            tempV = currentPoint.overallLength;
            if(isPositive){
                p2 = currentPoint.pos - lastPoint.right * halfLineWidth;
                p3 = currentPoint.pos - currentPoint.right * halfLineWidth;
                u0 = vec2f(0.5, tempV);
                u2 = vec2f(0.0, tempV - cornerUVLength * lastLengthUVRatio);
                u3 = vec2f(0.0, tempV + cornerUVLength * nextLengthUVRatio);
            }else{
                p2 = currentPoint.pos + currentPoint.right * halfLineWidth;
                p3 = currentPoint.pos + lastPoint.right * halfLineWidth;
                u0 = vec2f(0.5, tempV);
                u2 = vec2f(1.0, tempV + cornerUVLength * nextLengthUVRatio);
                u3 = vec2f(1.0, tempV - cornerUVLength * lastLengthUVRatio);
            }
            p0.y = lineOffsetY;
            p2.y = lineOffsetY;
            p3.y = lineOffsetY;
            drawLine(shapeIndex,p0,p2,p3,u0,u2,u3);
            break;
        }
        default://round
        {
            p0 = currentPoint.pos;
            var rotateMat:mat3x3<f32>;
            var rotateFrom:vec3<f32>;
            if(isPositive){
                rotateFrom = -lastPoint.right;
                rotateMat = buildRotateYMat3(-cornerAngle * 2.0 / f32(cornerPointExt));
            }else{
                rotateFrom = lastPoint.right;
                rotateMat = buildRotateYMat3(cornerAngle * 2.0 / f32(cornerPointExt));
            }
    
            tempV = currentPoint.overallLength - cornerUVLength * lastLengthUVRatio;
            var stepV = cornerUVLength * (nextLengthUVRatio + lastLengthUVRatio) / f32(cornerPointExt);
            for(var i = 0u; i < cornerPointExt; i ++){
                p2 = currentPoint.pos + rotateFrom * halfLineWidth;
                rotateFrom = rotateMat * rotateFrom;
                p3 = currentPoint.pos + rotateFrom * halfLineWidth;

                p0.y = lineOffsetY;
                p2.y = lineOffsetY;
                p3.y = lineOffsetY;

                if(isPositive){
                    u0 = vec2f(0.5, tempV + f32(i) * stepV);
                    u2 = vec2f(0.0, tempV + f32(i) * stepV);
                    u3 = vec2f(0.0, tempV + f32(i + 1u) * stepV);
                    drawLine(shapeIndex,p0,p2,p3,u0,u2,u3);
                }else{
                    u0 = vec2f(0.5, tempV + f32(i) * stepV);
                    u2 = vec2f(1.0, tempV + f32(i) * stepV);
                    u3 = vec2f(1.0, tempV + f32(i + 1u) * stepV);
                    drawLine(shapeIndex,p0,p3,p2,u0,u3,u2);
                }
            }
            break;
        }
    }
    //__________________________corner triangle end
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
    var overallLength:f32 = 0.0;
    
    for(var i = 0u; i < srcPointCount; i += 1u)
    {
        nextPoint = srcPathBuffer[curSrcIndex + 1u].xyy;
        nextPoint.y = 0.0;
        if(i > 0u){
            overallLength += length(currentPoint - lastPoint);
        }

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

        writeLinePoint(curDestIndex, shapeData, currentPoint, right, f32(i), overallLength);
        lastRight = right;

        lastPoint = currentPoint;
        currentPoint = nextPoint;
        curSrcIndex += 1u;
        curDestIndex += 1u;
    }
}

fn writeLinePoint(pointIndex:u32, shapeData:LineShape3D, pos:vec3<f32>, right:vec3<f32>, localPointIndex:f32, overallLength:f32)
{
    let pathIndex = pointIndex;
    destPathBuffer[pathIndex].pos = pos;
    destPathBuffer[pathIndex].up = vec3<f32>(0.0, 1.0, 0.0);
    destPathBuffer[pathIndex].right = right;
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
    destPathBuffer[pathIndex].overallLength = overallLength;
}

`