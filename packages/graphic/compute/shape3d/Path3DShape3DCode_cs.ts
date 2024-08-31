/**
 * @internal
 */
export let Path3DShape3DCode_cs = /*wgsl*/`

struct Path3DShape3D {
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

fn getPath3DShape3D(node:ShapeData) -> Path3DShape3D{
    return Path3DShape3D(
        node.base,
        node.xa, node.xb, node.xc, node.xd,
        node.xe, node.xf, node.xg, node.xh);
 }
 
fn drawPath3DFace(nodeData:ShapeData, currentPoint:Path3DKeyPoint){
    let shapeData:Path3DShape3D = getPath3DShape3D(nodeData);
    let baseData = nodeData.base;
    let isFirstPointOfShape = round(currentPoint.pointIndex) == 0.0;
    
    if(baseData.fill > 0.5 && baseData.srcIndexCount > 0.5 && isFirstPointOfShape){
        drawPath3DFilled(shapeData);
    }

    if(baseData.line > 0.5){
        let isLastPointOfShape = round(currentPoint.pointIndex) == round(baseData.destPointCount - 1.0);
        let isCurrentValid = currentPoint.invalidPoint < 0.5;
        if(baseData.isClosed < 0.5){
            let destStart = u32(round(baseData.destPointStart));
            let destCount = u32(round(baseData.destPointCount));
            let pointIndex = u32(round(currentPoint.pointIndex));
        
            var nextPointIndex:u32 = pointIndex + 1u;
            if(nextPointIndex >= destCount){
                nextPointIndex = 0u;
            }
            var prevPointIndex:u32 = destCount - 1u;
            if(pointIndex > 0u){
                prevPointIndex = pointIndex - 1u;
            }
            nextPointIndex += destStart;
            prevPointIndex += destStart;
        
            let nextPoint:Path3DKeyPoint = destPathBuffer[nextPointIndex];
            let prevPoint:Path3DKeyPoint = destPathBuffer[prevPointIndex];

            if(isFirstPointOfShape){
                if(isCurrentValid){
                    drawPath3DStart(shapeData, currentPoint);
                }
            }else{
                if(isLastPointOfShape){
                    if(prevPoint.invalidPoint < 0.5 && isCurrentValid){
                        drawPath3DEnd(shapeData, currentPoint);
                    }
                }else{
                    let lineJoin = u32(round(shapeData.lineJoin));
                    var cornerPointExt = 0u;
                    if(lineJoin == 0){ cornerPointExt = 1u;}
                    else if(lineJoin == 1){ cornerPointExt = 0u;}
                    else {
                        cornerPointExt = u32(round(shapeData.corner));
                        cornerPointExt = clamp(cornerPointExt, 2u, 8u);
                    }
                    
                    if(isCurrentValid){
                        if(prevPoint.invalidPoint > 0.5){
                            drawPath3DStart(shapeData, currentPoint);
                        }else{
                            drawPath3DCorner(shapeData, currentPoint);
                        }
                    }else{
                        if(prevPoint.invalidPoint < 0.5){
                            drawPath3DEnd(shapeData, currentPoint);
                        }
                    }
                }
            }
        }else{
            drawPath3DCorner(shapeData, currentPoint);
        }
    }
}

fn drawPath3DStart(shapeData:Path3DShape3D, currentPoint:Path3DKeyPoint){
    let baseData = shapeData.base;
 
    let destStart = u32(round(baseData.destPointStart));
    let halfLineWidth = shapeData.base.lineWidth * 0.5;

    let nextPoint:Path3DKeyPoint = destPathBuffer[1u + destStart + u32(round(currentPoint.pointIndex))];
    var p0 = currentPoint.pos - currentPoint.right * halfLineWidth;
    var p1 = currentPoint.pos + currentPoint.right * halfLineWidth;
    let deltaPos = (nextPoint.pos - currentPoint.pos) * 0.5;
    let halfLength = length(deltaPos);
    var p2 = p0 + deltaPos;
    var p3 = p1 + deltaPos;

    let tempV = currentPoint.overallLength;
    let u0 = vec2f(0.0, tempV);
    let u1 = vec2f(1.0, tempV);
    let u2 = vec2f(0.0, tempV + halfLength);
    let u3 = vec2f(1.0, tempV + halfLength);

    drawPath3DView(shapeIndex,p1,p0,p2,u1,u0,u2);
    drawPath3DView(shapeIndex,p1,p2,p3,u1,u2,u3);
}

fn drawPath3DEnd(shapeData:Path3DShape3D, currentPoint:Path3DKeyPoint){
    let baseData = shapeData.base;
 
    let destStart = u32(round(baseData.destPointStart));
    let pointIndex = u32(round(currentPoint.pointIndex));
    
    let prevPoint:Path3DKeyPoint = destPathBuffer[pointIndex - 1u + destStart];
    let halfLineWidth = shapeData.base.lineWidth * 0.5;

    var p0 = currentPoint.pos - currentPoint.right * halfLineWidth;
    var p1 = currentPoint.pos + currentPoint.right * halfLineWidth;
    let deltaPos = (prevPoint.pos - currentPoint.pos) * 0.5;
    
    var p2 = p0 + deltaPos;
    var p3 = p1 + deltaPos;
    
    let halfLength = length(deltaPos);
    var tempV = currentPoint.overallLength;

    let u2 = vec2f(0.0, tempV - halfLength);
    let u3 = vec2f(1.0, tempV - halfLength);
    let u0 = vec2f(0.0, tempV);
    let u1 = vec2f(1.0, tempV);

    drawPath3DView(shapeIndex,p1,p2,p0,u1,u2,u0);
    drawPath3DView(shapeIndex,p1,p3,p2,u1,u3,u2);
}

fn drawPath3DFilled(shapeData:Path3DShape3D){
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

        p0.z += fillOffsetY;
        p1.z += fillOffsetY;
        p2.z += fillOffsetY;

        u0 = vec2f(p0.x, p0.z);
        u1 = vec2f(p1.x, p1.z);
        u2 = vec2f(p2.x, p2.z);
    
        drawFace(shapeIndex,p1,p0,p2,u1,u0,u2);
    }
}

fn drawPath3DCorner(shapeData:Path3DShape3D, currentPoint:Path3DKeyPoint){
    var u0:vec2f;
    var u1:vec2f;
    var u2:vec2f;
    var u3:vec2f;

    var p0:vec3f;
    var p1:vec3f;
    var p2:vec3f;
    var p3:vec3f;

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

    nextPointIndex += destStart;
    lastPointIndex += destStart;

    let nextPoint:Path3DKeyPoint = destPathBuffer[nextPointIndex];
    let prevPoint:Path3DKeyPoint = destPathBuffer[lastPointIndex];
    let halfLineWidth = shapeData.base.lineWidth * 0.5;
    let cornerLength = shapeData.base.lineWidth;
    
    var curveFrom = (currentPoint.pos + prevPoint.pos) * 0.5;
    var curveCenter = currentPoint.pos;
    var curveTo = (currentPoint.pos + nextPoint.pos) * 0.5;
    var curveTotalLength = 0f;
    
    //prev half segment
    let halfDis_Last_Current = length(currentPoint.pos - prevPoint.pos) * 0.5;
    let lastCenterCoord = (currentPoint.pos + prevPoint.pos) * 0.5;
    
    let isPreLengthEnough = halfDis_Last_Current > cornerLength;
    var tempV:f32 = prevPoint.overallLength;

    var curveOverallLengthStart:f32 = prevPoint.overallLength + halfDis_Last_Current;
    if(isPreLengthEnough){
        p0 = lastCenterCoord - prevPoint.right * halfLineWidth;
        p1 = lastCenterCoord + prevPoint.right * halfLineWidth;
        
        p2 = currentPoint.pos - prevPoint.right * halfLineWidth;
        p3 = currentPoint.pos + prevPoint.right * halfLineWidth;
        
        let deltaPos = normalize(lastCenterCoord - currentPoint.pos) * cornerLength;
        p2 = p2 + deltaPos;
        p3 = p3 + deltaPos;
        
        curveFrom = (p2 + p3) * 0.5;
        
        u0 = vec2f(0.0, prevPoint.overallLength + halfDis_Last_Current);
        u1 = vec2f(1.0, prevPoint.overallLength + halfDis_Last_Current);
        tempV = prevPoint.overallLength + 2.0 * halfDis_Last_Current - cornerLength;
        u2 = vec2f(0.0, tempV);
        u3 = vec2f(1.0, tempV);
        drawPath3DView(shapeIndex,p1,p0,p2,u1,u0,u2);
        drawPath3DView(shapeIndex,p1,p2,p3,u1,u2,u3);
        
        curveTotalLength += cornerLength;
        curveOverallLengthStart = prevPoint.overallLength + 2.0 * halfDis_Last_Current - cornerLength;
    }else{
        curveTotalLength += halfDis_Last_Current;
    }

    //next half segment
     let halfDis_Current_Next = length(currentPoint.pos - nextPoint.pos) * 0.5;
     let nextCenterCoord = (currentPoint.pos + nextPoint.pos) * 0.5;
     let isNextLengthEnough = halfDis_Current_Next > cornerLength;
     if(isNextLengthEnough){
        p0 = nextCenterCoord - currentPoint.right * halfLineWidth;
        p1 = nextCenterCoord + currentPoint.right * halfLineWidth;
   
        p2 = currentPoint.pos - currentPoint.right * halfLineWidth;
        p3 = currentPoint.pos + currentPoint.right * halfLineWidth;

        let deltaPos = normalize(nextCenterCoord - currentPoint.pos) * cornerLength;
        p2 = p2 + deltaPos;
        p3 = p3 + deltaPos;

        curveTo = (p2 + p3) * 0.5;

        u0 = vec2f(0.0, currentPoint.overallLength + halfDis_Current_Next);
        u1 = vec2f(1.0, currentPoint.overallLength + halfDis_Current_Next);
        u2 = vec2f(0.0, currentPoint.overallLength + cornerLength);
        u3 = vec2f(1.0, currentPoint.overallLength + cornerLength);

        drawPath3DView(shapeIndex,p1,p2,p0,u1,u2,u0);
        drawPath3DView(shapeIndex,p1,p3,p2,u1,u3,u2);

        curveTotalLength += cornerLength;
    }else{
        curveTotalLength += halfDis_Current_Next;
    }

    //corner segment_______________

    var preForward = normalize(currentPoint.pos - prevPoint.pos);
    var curForward = normalize(nextPoint.pos - currentPoint.pos);
    preForward = normalize(cross(normalize(currentPoint.pos - cameraPos.xyz), preForward));
    curForward = normalize(cross(normalize(currentPoint.pos - cameraPos.xyz), curForward));

    preForward = normalize(cross(preForward, cameraUp.xyz));
    curForward = normalize(cross(curForward, cameraUp.xyz));

    var xyAngle = acos(dot(preForward, curForward));
    let maxSegment = clamp(shapeData.corner, 0.0, 10.0);
    var segmentCount = u32(xyAngle * maxSegment / pi) + 2u;
    
    var mixPoint:vec3f;
    var mix0:vec3f;
    var mix1:vec3f;

    p0 = curveFrom - prevPoint.right * halfLineWidth;
    p1 = curveFrom + prevPoint.right * halfLineWidth;

    u0 = vec2f(0.0, curveOverallLengthStart);
    u1 = vec2f(1.0, curveOverallLengthStart);

    u2 = u0;
    u3 = u1;

    let segmentUVLength = curveTotalLength / f32(segmentCount);
    for(var i = 0u; i < segmentCount; i += 1u){
        if(i == segmentCount - 1u){
            p2 = curveTo - currentPoint.right * halfLineWidth;
            p3 = curveTo + currentPoint.right * halfLineWidth;
        }else{
            var t = f32(i + 1u) / f32(segmentCount);
            mix0 = mix(curveFrom, curveCenter, t);
            mix1 = mix(curveCenter, curveTo, t);
            mixPoint = mix(mix0, mix1, t);
            
            var forward = normalize(mixPoint - (p0 + p1) * 0.5);
            var right = normalize(cross(normalize(mixPoint - cameraPos.xyz), forward));

            p2 = mixPoint - right * halfLineWidth;
            p3 = mixPoint + right * halfLineWidth;
        }

        u2.y += segmentUVLength;
        u3.y += segmentUVLength;

        drawPath3DView(shapeIndex,p1,p2,p0,u1,u2,u0);
        drawPath3DView(shapeIndex,p1,p3,p2,u1,u3,u2);

        p0 = p2;
        p1 = p3;

        u0 = u2;
        u1 = u3;
    }
}

fn writePath3DPath(nodeData:ShapeData){
    let shapeData:Path3DShape3D = getPath3DShape3D(nodeData);
    let shapeBase = shapeData.base;
    let destPointCount = shapeBase.destPointCount;
    let destPointStart = u32(round(shapeBase.destPointStart));
    let srcPointCount = u32(round(shapeBase.srcPointCount));
    let srcPointStart = shapeBase.srcPointStart;

    var currentPoint:vec3<f32>;
    var nextPoint:vec3<f32>;
    var prevPoint:vec3<f32>;

    var prevPoint3D:vec4<f32>;
    var nextPoint3D:vec4<f32>;
    var curPoint3D:vec4<f32>;

    var lastRight:vec3<f32>;

    var right:vec3<f32>;
    var forward:vec3<f32>;

    var curSrcIndex:u32 = u32(round(srcPointStart));
    var curDestIndex:u32 = destPointStart;

    curPoint3D = srcPathBuffer[curSrcIndex];

    var currentInvalid:f32;
    let firstPoint = currentPoint;

    var overallLength:f32 = 0.0;
    
    for(var i = 0u; i < srcPointCount; i += 1u)
    {
        nextPoint3D = srcPathBuffer[curSrcIndex + 1u];
        nextPoint = nextPoint3D.xyz;

        currentInvalid = curPoint3D.w;

        if(i > 0u){
            overallLength += length(curPoint3D.xyz - prevPoint3D.xyz);
        }

        if(i == 0u){
            //start
            forward = normalize(nextPoint - currentPoint);
            right = normalize(cross(normalize(currentPoint - cameraPos.xyz), forward));
        }else if(i + 1u == srcPointCount){
            //end
            if(shapeBase.isClosed > 0.0){
                forward = normalize(firstPoint - currentPoint);
                right = normalize(cross(normalize(currentPoint - cameraPos.xyz), forward));
            }else{
                right = lastRight;
            }
        }else{
            //center
            if(currentInvalid > 0.5){
                forward = normalize(currentPoint - prevPoint);
            }else{
                forward = normalize(nextPoint - currentPoint);
            }
            right = normalize(cross(normalize(currentPoint - cameraPos.xyz), forward));
        }

        writePath3DPoint(curDestIndex, shapeData, currentPoint, right, f32(i), overallLength, currentInvalid);
        lastRight = right;

        prevPoint = currentPoint;
        prevPoint3D = curPoint3D;
        currentPoint = nextPoint;
        curPoint3D = nextPoint3D;
        curSrcIndex += 1u;
        curDestIndex += 1u;
    }
}

fn drawPath3DView(shapeIndex:u32,p0:vec3f,p1:vec3f,p2:vec3f,u0:vec2f,u1:vec2f,u2:vec2f){
    let wP0 = vec3<f32>(p0.x, p0.y, p0.z + lineOffsetY);
    let wP1 = vec3<f32>(p1.x, p1.y, p1.z + lineOffsetY);
    let wP2 = vec3<f32>(p2.x, p2.y, p2.z + lineOffsetY);
    drawLine(shapeIndex,wP0,wP1,wP2,u0,u1,u2);
}


fn writePath3DPoint(pointIndex:u32, shapeData:Path3DShape3D, pos:vec3<f32>, right:vec3<f32>,
     localPointIndex:f32, overallLength:f32, invalidPoint:f32)
{
    let pathIndex = pointIndex;
    destPathBuffer[pathIndex].pos = pos;
    destPathBuffer[pathIndex].right = right;
    destPathBuffer[pathIndex].shapeIndex = f32(shapeIndex);
    destPathBuffer[pathIndex].pointIndex = localPointIndex;
    destPathBuffer[pathIndex].overallLength = overallLength;
    destPathBuffer[pathIndex].invalidPoint = invalidPoint;
}

`