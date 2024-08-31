/**
 * @internal
 */
export let VertexAttributeIndexShader: string = /*wgsl*/ `
    #include "WorldMatrixUniform"
    struct VertexAttributes{
        @builtin(instance_index) index : u32,

        @location(auto) position: vec3<f32>,
        @location(auto) normal: vec3<f32>,
        @location(auto) uv: vec2<f32>,
        @location(auto) TEXCOORD_1: vec2<f32>,
        @location(auto) vIndex: f32,
        @location(auto) index2: f32,
        
    }

    struct VertexOutput {
        @location(auto) index: f32,
        @location(auto) varying_UV0: vec2<f32>,
        @location(auto) varying_UV1: vec2<f32>,
        @location(auto) varying_ViewPos: vec4<f32>,
        @location(auto) varying_Clip: vec4<f32>,
        @location(auto) varying_WPos: vec4<f32>,
        @location(auto) varying_WNormal: vec3<f32>,
        @location(auto) varying_Color: vec4<f32>,
        #if USE_SHADOWMAPING
            @location(auto) varying_ShadowPos: vec4<f32>,
        #endif
        @builtin(position) member: vec4<f32>
    };

    struct TransformVertex{
        position:vec3<f32>,
        normal:vec3<f32>,
    }

    struct GraphicNodeStruct{
        matrixIndex:f32,
        texIndex:f32,
        tex2Index:f32,
        tex3Index:f32,

        fillRotation:f32,
        empty0:f32,
        empty1:f32,
        empty2:f32,

        baseColor:vec4f,
        lineColor:vec4f,
        emissiveColor:vec4f,
        uvRect:vec4f,
        uvRect2:vec4f,
        uvSpeed:vec4f,
    }

    var<private> ORI_VertexOut: VertexOutput ;
    var<private> worldMatrix: mat4x4<f32> ;
    var<private> graphicNode: GraphicNodeStruct ;

    fn ORI_Vert(vertex:VertexAttributes){
        var vertexPosition = vertex.position;
        var vertexNormal = vertex.normal;

        ORI_VertexOut.index = f32(vertex.vIndex) ;
        graphicNode = graphicBuffer[u32(round(vertex.vIndex))];
        let node_Matrix_M = models.matrix[u32(round(graphicNode.matrixIndex))];

        #if USE_TANGENT
            ORI_VertexOut.varying_Tangent = vertex.TANGENT ;
        #endif

        ORI_MATRIX_M = node_Matrix_M * ORI_MATRIX_M ;

        #if USE_BILLBOARD
            let billboardMatrix: mat3x3<f32> = calculateBillboardMatrix2(globalUniform.CameraPos.xyz,ORI_MATRIX_M[3].xyz,globalUniform.cameraWorldMatrix[1].xyz);
            vertexPosition = billboardMatrix * vertexPosition.xyz;
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
        ORI_VertexOut.varying_ViewPos = viewPosition ;
        ORI_VertexOut.varying_Clip = clipPosition;
        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_WNormal = normalize( vertexNormal.xyz);
        ORI_VertexOut.member = clipPosition ;
    }
`