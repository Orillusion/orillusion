

export let ColorPassFragmentOutput: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(0) color: vec4<f32>,
        #if USE_WORLDPOS
            @location(1) worldPos: vec4<f32>,
        #endif
        #if USEGBUFFER
            @location(2) worldNormal: vec4<f32>,
            @location(3) material: vec4<f32>,
        #endif
        // @builtin(frag_depth) out_depth: f32
    };
`
