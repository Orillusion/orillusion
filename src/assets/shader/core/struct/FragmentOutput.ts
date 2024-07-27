/**
 * @internal
 */
export let FragmentOutput: string = /*wgsl*/ `
    #if USE_CASTREFLECTION
        struct FragmentOutput {
            @location(auto) gBuffer: vec4<f32>,
            #if USE_OUTDEPTH
                @builtin(frag_depth) out_depth: f32
            #endif
        };
    #else
        struct FragmentOutput {
            @location(auto) color: vec4<f32>,
            @location(auto) gBuffer: vec4<f32>,
            #if USE_OUTDEPTH
                @builtin(frag_depth) out_depth: f32
            #endif
        };
    #endif
`
