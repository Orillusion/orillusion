/**
 * Camera motion blur. Reconstructs each pixel's world position from the
 * G-buffer depth, reprojects it with the previous frame's view-projection to
 * get a screen-space velocity, and averages the scene color along it.
 *
 * Camera-driven motion by default (the G-buffer carries no per-object
 * velocity); with USE_VELOCITY_TEX the velocity comes from `_MotionVector`
 * (MotionVectorPass), which includes per-object motion. Sky pixels are left
 * untouched.
 * @internal
 */
export let MotionBlur_cs: string = /*wgsl*/`
    #include "GlobalUniform"
    #include "GBufferStand"

    // Required by the included G-buffer helpers.
    const PI: f32 = 3.1415926;

    struct MotionBlurData {
        prevViewProj: mat4x4<f32>,
        // x = velocity scale, y = sample count, z = max blur (pixels), w = unused
        params: vec4<f32>,
    };

    @group(0) @binding(2) var<uniform> motionBlurData: MotionBlurData;
    @group(0) @binding(3) var inTex: texture_2d<f32>;
    @group(0) @binding(4) var outTex: texture_storage_2d<rgba16float, write>;
    #if USE_VELOCITY_TEX
        @group(0) @binding(5) var velocityTex: texture_2d<f32>;
    #endif

    @compute @workgroup_size(8, 8, 1)
    fn CsMain(@builtin(global_invocation_id) gid: vec3<u32>) {
        let fragCoord = vec2<i32>(gid.xy);
        let texSize = textureDimensions(inTex).xy;
        if (fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)) { return; }
        let center = textureLoad(inTex, fragCoord, 0);

        let scale = motionBlurData.params.x;
        let sampleCount = i32(clamp(motionBlurData.params.y, 2.0, 32.0));
        if (scale <= 0.0) {
            textureStore(outTex, fragCoord, center);
            return;
        }

        let fragUV = vec2<f32>(fragCoord) / vec2<f32>(texSize - 1u);
        useNormalMatrixInv();
        let gBuffer = getGBuffer(fragCoord);
        if (getRoughnessFromGBuffer(gBuffer) <= 0.0) {
            // sky / unwritten pixel
            textureStore(outTex, fragCoord, center);
            return;
        }

        var uvDelta = vec2<f32>(0.0);
        #if USE_VELOCITY_TEX
            // MotionVectorPass: camera motion everywhere, object motion where a mesh wrote the pixel.
            uvDelta = textureLoad(velocityTex, fragCoord, 0).xy;
        #else
            let worldPos = getWorldPositionFromGBuffer(gBuffer, fragUV);
            let prevClip = motionBlurData.prevViewProj * vec4<f32>(worldPos, 1.0);
            if (prevClip.w <= 0.0) {
                textureStore(outTex, fragCoord, center);
                return;
            }
            let prevNdc = prevClip.xyz / prevClip.w;
            let prevUv = vec2<f32>(prevNdc.x * 0.5 + 0.5, -prevNdc.y * 0.5 + 0.5);
            uvDelta = fragUV - prevUv;
        #endif

        // Velocity in pixels, scaled by the shutter and clamped.
        var velocity = uvDelta * vec2<f32>(texSize) * scale;
        let len = length(velocity);
        let maxLen = max(motionBlurData.params.z, 0.0);
        if (len < 0.5) {
            textureStore(outTex, fragCoord, center);
            return;
        }
        if (len > maxLen) { velocity = velocity * (maxLen / len); }

        // Average along [-v/2, +v/2], centred on the pixel.
        var acc = vec3<f32>(0.0);
        let maxCoord = vec2<i32>(texSize) - vec2<i32>(1);
        for (var i: i32 = 0; i < sampleCount; i = i + 1) {
            let t = (f32(i) + 0.5) / f32(sampleCount) - 0.5;
            let c = clamp(vec2<i32>(round(vec2<f32>(fragCoord) + velocity * t)), vec2<i32>(0), maxCoord);
            acc += textureLoad(inTex, c, 0).rgb;
        }
        textureStore(outTex, fragCoord, vec4<f32>(acc / f32(sampleCount), center.a));
    }
`;
