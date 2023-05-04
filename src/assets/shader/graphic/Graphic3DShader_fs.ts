


export let Graphic3DShader_fs: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(0) color: vec4<f32>,
        // #if USE_WORLDPOS
            @location(1) worldPos: vec4<f32>,
        // #endif
        // #if USEGBUFFER
            @location(2) worldNormal: vec4<f32>,
            @location(3) material: vec4<f32>
        // #endif
    };

    @fragment
    fn main(  
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
        return result;
    }
`