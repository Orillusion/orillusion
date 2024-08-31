/**
 * @internal
 */
export let ColorPassFragmentOutput: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(auto) color: vec4<f32>,
        #if USE_WORLDPOS
            @location(auto) worldPos: vec4<f32>,
        #endif
        #if USEGBUFFER
            @location(auto) worldNormal: vec4<f32>,
            @location(auto) material: vec4<f32>,
        #endif

        #if USE_OUTDEPTH
            @builtin(frag_depth) out_depth: f32
        #endif
    };
`
