export let VoxelShader: string = /*wgsl*/ `
    // #include "Common_vert"
    #include "WorldMatrixUniform"
    #include "GlobalUniform"
    #include "Inline_vert"
    #include "Common_frag"
    #include "UnLit_frag"

    const DEGREES_TO_RADIANS : f32 = 3.1415926 / 180.0;
    const PI : f32 = 3.1415926;

    struct VertexAttributes {
        @builtin(instance_index) index : u32,
        @location(0) position: vec3<f32>,
        @location(1) normal: vec3<f32>,
        @location(2) color: vec4<f32>,
        @location(3) uv: vec2<f32>,
    }

    struct VertexOutput {
        @location(0) index: f32,
        @location(1) varying_UV0: vec2<f32>,
        @location(2) varying_UV1: vec2<f32>,
        @location(3) varying_ViewPos: vec4<f32>,
        @location(4) varying_Clip: vec4<f32>,
        @location(5) varying_WPos: vec4<f32>,
        @location(6) varying_WNormal: vec3<f32>,
        @location(7) varying_Color: vec4<f32>,
        #if USE_SHADOWMAPING
            @location(8) varying_ShadowPos: vec4<f32>,
        #endif
        @builtin(position) member: vec4<f32>
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    var<private> ORI_VertexOut: VertexOutput;
    var<private> worldMatrix: mat4x4<f32>;

    @vertex
    fn VertMain(vertex:VertexAttributes) -> VertexOutput {
        vertex_inline(vertex);
        vert(vertex);
        return ORI_VertexOut;
    }

    fn vert(vertex:VertexAttributes) -> VertexOutput {
        var vertexPosition = vertex.position;
        var vertexNormal = vertex.normal;

        ORI_VertexOut.index = f32(vertex.index);

        // let node_Matrix_M = models.matrix[u32(vertex.index)];

        #if USE_TANGENT
            ORI_VertexOut.varying_Tangent = vertex.TANGENT;
        #endif

        // ORI_MATRIX_M = node_Matrix_M * ORI_MATRIX_M;

        worldMatrix = ORI_MATRIX_M;

        let nMat = mat3x3<f32>(ORI_MATRIX_M[0].xyz,ORI_MATRIX_M[1].xyz,ORI_MATRIX_M[2].xyz);
        ORI_NORMALMATRIX = transpose(inverse( nMat ));

        var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));

        #if TRANSFORMVERTEX
            var transformVertex = transformVertex(worldPos.xyz,vertexNormal,vertex);
            worldPos = vec4<f32>(transformVertex.position ,worldPos.w);
            vertexNormal = transformVertex.normal ;
        #endif

        var viewPosition = ORI_MATRIX_V * worldPos;
        var clipPosition = ORI_MATRIX_P * viewPosition;

        ORI_VertexOut.varying_UV0 = vertex.uv.xy;
        ORI_VertexOut.varying_UV1 = vertex.uv.xy;
        ORI_VertexOut.varying_ViewPos = viewPosition / viewPosition.w;
        ORI_VertexOut.varying_Clip = clipPosition;
        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_WNormal = normalize( vertexNormal.xyz);
        ORI_VertexOut.varying_Color = vertex.color;
        ORI_VertexOut.member = clipPosition;
        return ORI_VertexOut;
    }

    fn frag(){
        let uv = ORI_VertexVarying.fragUV0;
        var color = textureSample(baseMap, baseMapSampler, uv) * ORI_VertexVarying.vColor;
      
        // color += graphicNode.emissiveColor;
        // if(color.w < 0.5){
        //     discard;
        // }

        let outColor = vec4f(color.rgb, 1.0);// * materialUniform.baseColor;
        
        ORI_ShadingInput.BaseColor = vec4f(outColor.xyz, 1.0);
        UnLit();
    }
`;
