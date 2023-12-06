export let Graphic3DShader: string = /*wgsl*/ `
    #include "WorldMatrixUniform"
    #include "GlobalUniform"

    struct VertexAttributes {
        @location(0) position: vec4<f32>,
        @location(1) color: vec4<f32>,
    }

    struct VertexOutput {
        @location(0) varying_WPos: vec4<f32>,
        @location(1) varying_Color: vec4<f32>,
        @builtin(position) member: vec4<f32>
    };

    @vertex
    fn VertMain( vertex:VertexAttributes ) -> VertexOutput {
        var worldMatrix = models.matrix[u32(vertex.position.w)];
        var worldPos = (worldMatrix * vec4<f32>(vertex.position.xyz, 1.0));
        var viewPosition = ((globalUniform.viewMat) * worldPos);
        var clipPosition = globalUniform.projMat * viewPosition;

        var ORI_VertexOut: VertexOutput; 
        ORI_VertexOut.varying_WPos = worldPos;
        ORI_VertexOut.varying_Color = vertex.color;
        ORI_VertexOut.member = clipPosition;
        return ORI_VertexOut;
    }

    struct FragmentOutput {
        @location(0) color: vec4<f32>,
        // #if USE_WORLDPOS
            @location(1) worldPos: vec4<f32>,
        // #endif
        // #if USEGBUFFER
            @location(2) worldNormal: vec4<f32>,
            @location(3) material: vec4<f32>,
        // #endif
        @builtin(frag_depth) out_depth: f32
    };

    @fragment
    fn FragMain(  
        @location(0) vWorldPos: vec4<f32>,
        @location(1) varying_Color: vec4<f32>,
    ) -> FragmentOutput {
        var result: FragmentOutput;

        // #if USE_WORLDPOS
            result.worldPos = vWorldPos;
        // #endif

        // #if USEGBUFFER
            // result.worldNormal = vec4<f32>(0.0, 0.0, 0.0, 1.0); 
            result.material = vec4<f32>(0.0, 1.0, 0.0, 0.0);
        // #endif

        result.color = varying_Color;

        // let n = globalUniform.near ;
        // let f = globalUniform.far ;
        // let z = ORI_VertexVarying.fragCoord.z ;
        // let pt = pow((f / n),z);
        // let ratio = n * pt / (f / n);
        // result.out_depth =  ratio ;
        return result;
    }
`;
