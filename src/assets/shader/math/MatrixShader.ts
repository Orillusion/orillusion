/**
 * @internal
 */
export let MatrixShader = /* wgsl */ `
    #include "MathShader"

    fn buildMatrix3x3() -> mat3x3<f32>{
        var mat3 = mat3x3<f32>(
            1.0,0.0,0.0,
            0.0,1.0,0.0,
            0.0,0.0,1.0,
        );
        return mat3 ;
    }

    fn buildMatrix4x4() -> mat4x4<f32>{
        var mat4 = mat4x4<f32>(
            1.0,0.0,0.0,0.0,
            0.0,1.0,0.0,0.0,
            0.0,0.0,1.0,0.0,
            0.0,0.0,0.0,1.0,
        );
        return mat4 ;
    }

    fn buildRotateXMat3(rad:f32) -> mat3x3<f32>{
        var xrot = mat3x3<f32>(
            1.0,0.0,0.0,
            0.0,cos(rad),-sin(rad),
            0.0,sin(rad),cos(rad)
        );
        return xrot;
    }

    fn buildRotateXMat4(rad:f32,x:f32,y:f32,z:f32) -> mat4x4<f32>{
        var xrot = mat4x4<f32>(
            1.0,0.0,0.0,0.0,
            0.0,cos(rad),-sin(rad),0.0,
            0.0,sin(rad),cos(rad),0.0,
            x,y,z,1.0,
        );
        return xrot;
    }

    fn buildRotateXYZMat4(radX:f32,radY:f32,radZ:f32,x:f32,y:f32,z:f32) -> mat4x4<f32>{
        var xRot = mat4x4<f32>(
            1.0,0.0,0.0,0.0,
            0.0,cos(radX),-sin(radX),0.0,
            0.0,sin(radX),cos(radX),0.0,
            0.0,0.0,0.0,1.0,
        );
        var yRot = mat4x4<f32>(
            cos(radY),0.0,sin(radY),0.0,
            0.0,1.0,0.0,0.0,
            -sin(radY),0.0,cos(radY),0.0,
            0.0,0.0,0.0,1.0,
        );
        var zRot = mat4x4<f32>(
            cos(radZ),-sin(radZ),0.0,0.0,
            sin(radZ), cos(radZ),0.0,0.0,
            0.0,0.0,1.0,0.0,
            0.0,0.0,0.0,1.0,
        );
        var fMat = xRot * yRot * zRot ;
        fMat[3].x = x;
        fMat[3].y = y;
        fMat[3].z = z;
        return fMat;
    }

    fn buildRotateYMat3(rad:f32) -> mat3x3<f32>{
        var yrot = mat3x3<f32>(
            cos(rad),0.0,sin(rad),
            0.0,1.0,0.0,
            -sin(rad),0.0,cos(rad)
        );
        return yrot ;
    }

    fn buildRotateZ(rad:f32) -> mat3x3<f32>{
        var zrot = mat3x3<f32>(
            cos(rad),-sin(rad),0.0,
            sin(rad), cos(rad),0.0,
            0.0,0.0,1.0
        );
        return zrot;
    }

    // fn buildRotateXMat4(rad:f32) -> mat4x4<f32>{
    //     var xrot = mat4x4<f32>(
    //         1.0,0.0,0.0,0.0,
    //         0.0,cos(rad),-sin(rad),0.0,
    //         0.0,sin(rad),cos(rad),0.0,
    //         0.0,0.0,0.0,1.0);
    //     return xrot;
    // }

    fn bulidTranslateMat4(x:f32,y:f32,z:f32) -> mat4x4<f32>{
        var trans = mat4x4<f32>(
            1.0,0.0,0.0,0.0,
            0.0,1.0,0.0,0.0,
            0.0,0.0,1.0,0.0,
            x,y,z,1.0);
        return trans;
    }

`;
