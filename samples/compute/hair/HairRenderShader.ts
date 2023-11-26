
export let HairRenderShader = /* wgsl */ `
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"
    #include "MathShader"

    struct Particle_global {
        instance_index : f32,
        particles_Radius : f32,
        time : f32,
        timeDelta : f32,
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;

    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    @group(3) @binding(0)
    var<storage, read> particleGlobalData: Particle_global;
    @group(3) @binding(1)
    var<storage, read> particlePosition : array<vec4<f32>>;
    @group(3) @binding(2)
    var<storage, read> anchorPosition : array<vec4<f32>>;

    fn calculateTransformationMatrix(index: u32) -> mat4x4<f32> {
        var result: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(1.0, 0.0, 0.0, 0.0),
            vec4<f32>(0.0, 1.0, 0.0, 0.0),
            vec4<f32>(0.0, 0.0, 1.0, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0),
        );


        var anchor = vec3<f32>(anchorPosition[index][0], anchorPosition[index][1], anchorPosition[index][2]);
        var position = vec3<f32>(particlePosition[index][0], particlePosition[index][1], particlePosition[index][2]);
        result[3][0] = (anchor[0] + position[0]) / 2.0;// - 0.6;
        result[3][1] = (anchor[1] + position[1]) / 2.0;// + 0.5;
        result[3][2] = (anchor[2] + position[2]) / 2.0;

        var cosz = 1.0;
        var sinz = 0.0;
        var vector = anchor - position;
        var length = distance(anchor, position);
        var scale = 0.0;
        if (length > 0.0001){
            cosz = vector.y / length;
            sinz = vector.x / length;
            scale = 1.0;
        }
        
        result[0][0] = cosz;
        result[0][1] = -sinz;
        result[1][0] = sinz;
        result[1][1] = cosz;
        result[3][3] = scale;
        return result;
    }

    fn vert(vertex:VertexAttributes) -> VertexOutput {
        
        var worldMatrix = models.matrix[u32(particleGlobalData.instance_index)] * calculateTransformationMatrix(vertex.index);

        var wPosition = vertex.position.xyz;

        // wPosition.x += particlePos.x;
        // wPosition.y += particlePos.y;
        // wPosition.z += particlePos.z;

        ORI_VertexOut.varying_UV0 = vertex.uv;

        var worldPos = (worldMatrix * vec4<f32>(wPosition.xyz, 1.0));
        var viewPosition = ((globalUniform.viewMat) * worldPos);

        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_WPos.w = f32(particleGlobalData.instance_index);

        var clipPosition = globalUniform.projMat * viewPosition ;

        //ORI_VertexOut.projPos = clipPosition.xyz;

        ORI_VertexOut.member = clipPosition;
        
        var normalMatrix = transpose(inverse( mat3x3<f32>(worldMatrix[0].xyz,worldMatrix[1].xyz,worldMatrix[2].xyz) ));
        ORI_VertexOut.varying_WNormal = normalize(normalMatrix * vertex.normal);
        //ORI_VertexOut.pointCoord = normalize(vertex.position.xy) + vec2<f32>(0.5, 0.5);
        ORI_VertexOut.varying_Color = vec4<f32>(246.0/255.0, 160/255.0, 0.0, 1.0);
        // vertexOut.fragPosition = ((globalUniform.viewMat) * worldPos);
        return ORI_VertexOut;
    }

    fn frag() {
        let color = ORI_VertexVarying.vColor;
        ORI_ShadingInput.BaseColor = color;
        UnLit();
    }`