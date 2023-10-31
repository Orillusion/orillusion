export let ParticleRenderShader = /* wgsl */ `
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"
    #include "MathShader"
    #include "ParticleDataStruct"

    @group(1) @binding(0)
    var baseMapSampler: sampler;

    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    @group(3) @binding(0)
    var<storage, read> particleGlobalData: GlobalData;

    @group(3) @binding(1)
    var<storage, read> particleLocalDatas: array<ParticleData>;

    fn vert(vertex:VertexAttributes) -> VertexOutput {
        let particle = particleLocalDatas[vertex.index];
        if (particle.hide < 0.99f) {
            return ORI_VertexOut;
        }

        const LocalSpace = 0;
        const WorldSpace = 1;
        if (particleGlobalData.simulatorSpace == WorldSpace) {
            ORI_MATRIX_M = mat4x4<f32> (
                vec4<f32>(1.0, 0.0, 0.0, 0.0),
                vec4<f32>(0.0, 1.0, 0.0, 0.0),
                vec4<f32>(0.0, 0.0, 1.0, 0.0),
                vec4<f32>(0.0, 0.0, 0.0, 1.0)
            );
        } else {
            ORI_MATRIX_M = models.matrix[particleGlobalData.instance_index];
        }

        var vertexPosition = vertex.position;

        let scaleMatrix = mat4x4<f32> (
            vec4<f32>(particle.vScale.x, 0.0, 0.0, 0.0),
            vec4<f32>(0.0, particle.vScale.y, 0.0, 0.0),
            vec4<f32>(0.0, 0.0, particle.vScale.z, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );
        vertexPosition = (scaleMatrix * vec4<f32>(vertexPosition.xyz, 1.0)).xyz;

        let rotMatrix = makeRotateMatrix(
            particle.vRot.x, 
            particle.vRot.y, 
            particle.vRot.z
        );
        vertexPosition = (rotMatrix * vec4<f32>(vertexPosition.xyz, 1.0)).xyz;

        let centerPos = (ORI_MATRIX_M * vec4<f32>(particle.vPos.xyz, 1.0)).xyz;
        let billboardMatrix: mat3x3<f32> = calculateBillboardMatrix(centerPos, ORI_MATRIX_M);
        vertexPosition = billboardMatrix * vertexPosition.xyz;
        vertexPosition += particle.vPos.xyz;

        var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));
        var viewPosition = ORI_MATRIX_V * worldPos;
        var clipPosition = ORI_MATRIX_P * viewPosition;

        let size = vec2<u32>(particleGlobalData.textureSheet_TextureWidth, particleGlobalData.textureSheet_TextureHeight);
        let frame: u32 = particle.textureSheet_Frame;
        let clipW: u32 = u32(size.x) / particleGlobalData.textureSheet_ClipCol;
        let ratioW: f32 = f32(clipW) / f32(size.x);
        let ratioH: f32 = f32(clipW) / f32(size.y);
        let col: u32 = frame % particleGlobalData.textureSheet_ClipCol;
        let row: u32 = frame / particleGlobalData.textureSheet_ClipCol;
        ORI_VertexOut.varying_UV0.x = (vertex.uv.x + f32(col)) * ratioW;
        ORI_VertexOut.varying_UV0.y = (vertex.uv.y + f32(row)) * ratioH;

        // ORI_VertexOut.varying_UV0 = vertex.uv.xy;
        ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;
        ORI_VertexOut.varying_Clip = clipPosition;
        ORI_VertexOut.varying_WPos = vec4<f32>(worldPos.xyz, f32(particleGlobalData.instance_index));
        // ORI_VertexOut.varying_WNormal = normalize(ORI_NORMALMATRIX * vertexNormal.xyz);
        ORI_VertexOut.varying_Color = particle.vColor;
        ORI_VertexOut.member = clipPosition;
        return ORI_VertexOut;
    }

    fn frag() {
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 
        let color = textureSample(baseMap,baseMapSampler, uv);
        
        ORI_ShadingInput.BaseColor = color * materialUniform.baseColor * ORI_VertexVarying.vColor;
        UnLit();
    }

    fn quaternionTransform(q: vec4<f32>, v: vec3<f32>) -> vec3<f32> {
        let u: vec3<f32> = q.xyz;
        let uv: vec3<f32> = cross(u, v);
        let uuv: vec3<f32> = cross(u, uv);
        return v + ((uv * q.w) + uuv) * 2.0;
    }

    fn calculateBillboardMatrix(pos: vec3<f32>, worldMatrix: mat4x4<f32>) -> mat3x3<f32> {
        let dir: vec3<f32> = normalize(globalUniform.cameraWorldMatrix[3].xyz - pos.xyz);
        let mat3 = mat3x3<f32> (
            worldMatrix[0].xyz,
            worldMatrix[1].xyz,
            worldMatrix[2].xyz
         );
         let v3Look: vec3<f32> = normalize(dir * mat3);
         let v3Right: vec3<f32> = normalize(cross(vec3<f32>( 0.0 , 1.0 , 0.0 ) * mat3, v3Look));
         let v3Up: vec3<f32> = cross(v3Look, v3Right);
         return mat3x3<f32>(v3Right, v3Up, v3Look);
    }

    fn makeAxleRotationMatrix(axis: vec3<f32>, angle: f32) -> mat4x4<f32> {
        var x = axis.x;
        var y = axis.y;
        var z = axis.z;

        var n = x*x +y*y + z*z;
        if (n != 1.0f) {
            n = sqrt(n);
            if (n > 0.000001) {
                n = 1.0f / n;
                x *= n;
                y *= n;
                z *= n;
            }
        }

        let c = cos(angle);
        let s = sin(angle);

        let t = 1.0 - c;
        let tx = t * x;
        let ty = t * y;
        let tz = t * z;
        let txy = tx * y;
        let txz = tx * z;
        let tyz = ty * z;
        let sx = s * x;
        let sy = s * y;
        let sz = s * z;

        return mat4x4<f32>(
            vec4<f32>(c + tx*x, txy + sz, txz - sy, 0.0),
            vec4<f32>(txy - sz, c + ty*y, tyz + sx, 0.0),
            vec4<f32>(txz + sy, tyz - sx, c + tz*z, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0),
        );
    }

   fn quaternionToRotationMatrix(q: vec4<f32>) -> mat3x3<f32> {
       let qx2: f32 = q.x * q.x;
       let qy2: f32 = q.y * q.y;
       let qz2: f32 = q.z * q.z;
       let qwqx: f32 = q.w * q.x;
       let qwqy: f32 = q.w * q.y;
       let qwqz: f32 = q.w * q.z;
       let qxqy: f32 = q.x * q.y;
       let qxqz: f32 = q.x * q.z;
       let qyqz: f32 = q.y * q.z;
       return mat3x3<f32>(
           vec3<f32>(1.0 - 2.0 * (qy2 + qz2), 2.0 * (qxqy - qwqz), 2.0 * (qxqz + qwqy)),
           vec3<f32>(2.0 * (qxqy + qwqz), 1.0 - 2.0 * (qx2 + qz2), 2.0 * (qyqz - qwqx)),
           vec3<f32>(2.0 * (qxqz - qwqy), 2.0 * (qyqz + qwqx), 1.0 - 2.0 * (qx2 + qy2)),
       );
   }

    fn makeRotateMatrix(angleX: f32, angleY: f32, angleZ: f32) -> mat4x4<f32> {
        let cosX: f32 = cos(angleX);
        let sinX: f32 = sin(angleX);
        let cosY: f32 = cos(angleY);
        let sinY: f32 = sin(angleY);
        let cosZ: f32 = cos(angleZ);
        let sinZ: f32 = sin(angleZ);

        let rotX: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(1.0, 0.0, 0.0, 0.0),
            vec4<f32>(0.0, cosX, -sinX, 0.0),
            vec4<f32>(0.0, sinX, cosX, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        let rotY: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(cosY, 0.0, sinY, 0.0),
            vec4<f32>(0.0, 1.0, 0.0, 0.0),
            vec4<f32>(-sinY, 0.0, cosY, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        let rotZ: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(cosZ, -sinZ, 0.0, 0.0),
            vec4<f32>(sinZ, cosZ, 0.0, 0.0),
            vec4<f32>(0.0, 0.0, 1.0, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        return rotZ * rotY * rotX;
    }

   fn rotationMatrixToQuaternion(m: mat3x3<f32>) -> vec4<f32> {
        var tr: f32 = m[0][0] + m[1][1] + m[2][2];

        if (tr > 0.0) {
            var s: f32 = sqrt(1.0 + tr);
            var invs: f32 = 0.5 / s;

            return vec4<f32>(
                (m[1][2] - m[2][1]) * invs,
                (m[2][0] - m[0][2]) * invs,
                (m[0][1] - m[1][0]) * invs,
                0.5 * s
            );
        } else {
            var i:i32 = 0;
            if (m[1][1] > m[0][0]) { i = 1; }
            if (m[2][2] > m[i][i]) { i = 2; }

            var j:i32 = (i + 1) % 3;
            var k:i32 = (j + 1) % 3;

            var s: f32 = sqrt(m[i][i] - m[j][j] - m[k][k] + 1.0);
            var invs: f32 = 0.5 / s;

            var q: vec4<f32>;
            q[i] = 0.5 * s;
            q[3] = (m[j][k] - m[k][j]) * invs;
            q[j] = (m[i][j] + m[j][i]) * invs;
            q[k] = (m[i][k] + m[k][i]) * invs;

            return q;
        }
    }
`;
