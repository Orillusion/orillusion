


export let Graphic3DShader_fs: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(auto) color: vec4<f32>,
        // #if USE_WORLDPOS
            @location(auto) worldPos: vec4<f32>,
        // #endif
        // #if USEGBUFFER
            @location(auto) worldNormal: vec4<f32>,
            @location(auto) material: vec4<f32>,
        // #endif
        @builtin(frag_depth) out_depth: f32
    };

    @fragment
    fn main(  
        @location(auto) vWorldPos: vec4<f32>,
        @location(auto) varying_Color: vec4<f32>,
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
`