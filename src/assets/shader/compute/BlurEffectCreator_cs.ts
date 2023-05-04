export let BlurEffectCreatorSample_cs: string = /*wgsl*/ `
    struct ImageSize {
        srcWidth: i32,
            srcHeight : i32,
                dstWidth : i32,
                    dstHeight : i32,
    };

    @group(0) @binding(0) var<uniform>size : ImageSize;
    @group(0) @binding(1) var inputTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;

    @compute @workgroup_size(8, 8, 1)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        var uv: vec2<f32> = vec2<f32>(f32(GlobalInvocationID.x) / f32(size.dstWidth), f32(GlobalInvocationID.y) / f32(size.dstHeight));
        uv = uv * vec2<f32>(f32(size.srcWidth), f32(size.srcHeight));
        var dstId: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
        var srcId: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x * 2u), i32(GlobalInvocationID.y * 2u));
        textureStore(outputTexture, dstId, textureLoad(inputTexture, srcId, 0));
    }
`

export let BlurEffectCreatorBlur_cs: string = /*wgsl*/ `
    struct ImageSize {
        srcWidth: i32,
            srcHeight : i32,
                dstWidth : i32,
                    dstHeight : i32,
    };

    @group(0) @binding(0) var<uniform>size : ImageSize;
    @group(0) @binding(1) var inputTexture: texture_2d<f32>;
    @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;

    fn repeat_i32(id: i32, max: i32) -> i32 {
        var ret = id;
        if (id < 0) {
            ret = max + id;
        }
        if (id >= max) {
            ret = id - max;
        }
        return ret;
    }

    fn clamp_i32(id: i32, max: i32) -> i32 {
        var ret = id;
        if (id < 0) {
            ret = 0;
        }
        if (id >= max) {
            ret = max - 1;
        }
        return ret;
    }

    fn blur(idx: u32) -> vec4 < f32 > {
        var id: vec2<i32>;
        id.y = i32(idx) / size.srcWidth;
        id.x = i32(idx) - i32(id.y) * size.srcWidth;
        var _BlurSpread: i32 = 1;
        var result = vec4<f32>(0.0, 0.0, 0.0, 0.0);
        let g: array < f32, 3u > = array<f32, 3u > (0.4026, 0.2442, 0.0545);
        var uv: vec2<i32>;
        for(var h: i32 = 0; h< 5; h = h + 1) {
        let offsetU: i32 = (h - 2) * _BlurSpread;
        uv.x = id.x + offsetU;
        uv.x = clamp_i32(uv.x, size.srcWidth);
        for (var v: i32 = 0; v < 5; v = v + 1) {
            let offsetV: i32 = (v - 2) * _BlurSpread;
            uv.y = id.y + offsetV;
            uv.y = clamp(uv.y, 0, size.srcHeight);
            let weightU: i32 = abs(h - 2);
            let weightV: i32 = abs(v - 2);
            let resultWeight: f32 = g[weightU] * g[weightV];
            var colorf32: vec4<f32> = textureLoad(inputTexture, uv, 0);
            let sampleColor: vec4<f32> = vec4<f32>(colorf32 * resultWeight);
            result = result + sampleColor;
        }
    }

    return result;
    }

    @compute @workgroup_size(8, 8, 1)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        var uv: vec2<f32> = vec2<f32>(f32(GlobalInvocationID.x) / f32(size.dstWidth), f32(GlobalInvocationID.y) / f32(size.dstHeight));
        uv = uv * vec2<f32>(f32(size.srcWidth), f32(size.srcHeight));
        let srcIdx = i32(uv.y) * size.srcWidth + i32(uv.x);
        var dstId: vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));
        textureStore(outputTexture, dstId, blur(u32(srcIdx)));
    }
`

