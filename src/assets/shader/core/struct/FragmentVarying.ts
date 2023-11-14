
export let FragmentVarying: string = /*wgsl*/ `
    struct FragmentVarying {
        @location(0) index: f32,
        @location(1) fragUV0: vec2<f32>,
        @location(2) fragUV1: vec2<f32>,
        @location(3) viewPosition: vec4<f32>,
        @location(4) fragPosition: vec4<f32>,
        @location(5) vWorldPos: vec4<f32>,
        @location(6) vWorldNormal: vec3<f32>,
        @location(7) vColor: vec4<f32>,

        #if USE_SHADOWMAPING
            @location(8) vShadowPos: vec4<f32>,
        #endif

        #if USE_TANGENT
            @location(9) TANGENT: vec4<f32>,
        #endif
        
        @builtin(front_facing) face: bool,
        @builtin(position) fragCoord : vec4<f32>
    };
`
