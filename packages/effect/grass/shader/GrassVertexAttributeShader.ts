
export let GrassVertexAttributeShader: string = /*wgsl*/ `
    #include "WorldMatrixUniform"
    struct VertexAttributes{
        @builtin(instance_index) index : u32,

        @location(0) position: vec3<f32>,
        @location(1) normal: vec3<f32>,
        @location(2) uv: vec2<f32>,
        @location(3) TEXCOORD_1: vec2<f32>,
        @location(4) vIndex: f32,
        @location(5) weights0: vec4<f32>, 
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

    struct TransformVertex{
        position:vec3<f32>,
        normal:vec3<f32>,
    }

    var<private> ORI_VertexOut: VertexOutput ;
    var<private> worldMatrix: mat4x4<f32> ;

    fn ORI_Vert(vertex:VertexAttributes){
        var vertexPosition = vertex.position;
        var vertexNormal = vec3<f32>(0.0,0.0,-1.0);

        #if USE_TANGENT
            ORI_VertexOut.varying_Tangent = vertex.TANGENT ;
        #endif

        worldMatrix = ORI_MATRIX_M ;

        let nMat = mat3x3<f32>(ORI_MATRIX_M[0].xyz,ORI_MATRIX_M[1].xyz,ORI_MATRIX_M[2].xyz) ;
        ORI_NORMALMATRIX = transpose(inverse( nMat ));

        var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));

        #if TRANSFORMVERTEX
            var transformVertex = transformVertex(worldPos.xyz,vertexNormal,vertex);
            worldPos = vec4<f32>(transformVertex.position ,worldPos.w);
            vertexNormal = transformVertex.normal ;
        #endif

        var viewPosition = ORI_MATRIX_V * worldPos;
        var clipPosition = ORI_MATRIX_P * viewPosition ;


        ORI_VertexOut.varying_UV0 = vertex.uv.xy ;
        ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;
        ORI_VertexOut.varying_ViewPos = viewPosition / viewPosition.w;
        ORI_VertexOut.varying_Clip = clipPosition;
        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_WNormal = normalize( vertexNormal.xyz);
        ORI_VertexOut.member = clipPosition ;
    }
`