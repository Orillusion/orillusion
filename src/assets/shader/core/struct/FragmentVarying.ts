
export let FragmentVarying: string = /*wgsl*/ `
    struct FragmentVarying {
        @location(0) fragUV0: vec2<f32>,
        @location(1) fragUV1: vec2<f32>,
        @location(2) viewPosition: vec4<f32>,
        @location(3) fragPosition: vec4<f32>,
        @location(4) vWorldPos: vec4<f32>,
        @location(5) vWorldNormal: vec3<f32>,
        @location(6) vColor: vec4<f32>,

        #if USE_SHADOWMAPING
            @location(7) vShadowPos: vec4<f32>,
        #endif

        #if USE_TANGENT
            @location(8) TANGENT: vec4<f32>,
        #endif
        
        @builtin(front_facing) face: bool,
        @builtin(position) fragCoord : vec4<f32>
    };
`
