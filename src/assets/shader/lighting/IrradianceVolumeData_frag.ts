export let IrradianceVolumeData_frag: string = /*wgsl*/ `
    struct IrradianceVolumeData {
        //0
        orientationIndex:f32,
            hysteresis:f32,
            OctRTSideSize:f32,
            OctRTMaxSize:f32,

            //1
            startX:f32,
            startY:f32,
            startZ:f32,
            ProbeSpace:f32,

            //2
            gridXCount:f32,
            gridYCount:f32,
            gridZCount:f32,
            maxDistance:f32,

            //3
            depthSharpness:f32,
            ProbeSourceTextureSize:f32,
            ProbeSize:f32,
            bounceIntensity:f32,

            //4
            probeRoughness:f32,
            normalBias:f32,
            irradianceChebyshevBias:f32,
            rayNumber:f32,

            //5
            irradianceDistanceBias:f32,
            indirectIntensity:f32,
            ddgiGamma:f32,
            lerpHysteresis:f32,
            //6

            debugX:f32,
            debugY:f32,
            debugZ:f32,
            slot0:f32,

            //..
            v7:vec4<f32>,
    }
`