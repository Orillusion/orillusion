#include "GlobalUniform"
#include "WorldMatrixUniform"


struct VertexInput {
            @builtin(instance_index) index: u32,
            @location(0) position: vec3<f32>,
            @location(1) normal: vec3<f32>,
            @location(2) uv: vec2<f32>,
        };

struct VertexOutput {
            @location(0) uv: vec2<f32>,
            @location(1) color: vec4<f32>,
            @location(2) worldPos: vec4<f32>,
            @builtin(position) member: vec4<f32>
        };

struct MVPMatrix {
            cameraPos_h: vec3<f32>,
            cameraPos_l: vec3<f32>,
            matrixMVP_RTE: mat4x4<f32>,
        };

        @group(2) @binding(0)
        var<uniform> args: MVPMatrix;

fn applyLogarithmicDepth(clipPosition: vec4<f32>,logarithmicDepthConstant: f32,perspectiveFarPlaneDistance: f32) -> vec4<f32> {
    let z = ((2.0 * log((logarithmicDepthConstant * clipPosition.z) + 1.0) / log((logarithmicDepthConstant * perspectiveFarPlaneDistance) + 1.0)) - 1.0) * clipPosition.w;
    return vec4<f32>(clipPosition.x, clipPosition.y, z, clipPosition.w);
}

@vertex
fn VertMain(in: VertexInput) -> VertexOutput {
    let position_h = in.position;
    let position_l = in.normal;
    let highDiff = position_h - args.cameraPos_h;
    let lowDiff = position_l - args.cameraPos_l;
    let clipPosition = args.matrixMVP_RTE * vec4<f32>(highDiff + lowDiff, 1.0);

    var out: VertexOutput;
    out.uv = in.uv;
    out.color = vec4<f32>(1.0, 1.0, 1.0, 1.0);
    out.member = clipPosition;


    return out;
}

struct FragmentInput {
            @location(0) uv: vec2<f32>,
            @location(1) color: vec4<f32>,
            @location(2) worldPos: vec4<f32>,
            @builtin(position) member: vec4<f32>
        };

struct FragmentOutput {
            @location(0) color: vec4<f32>,
            #if USE_WORLDPOS
                @location(1) worldPos: vec4<f32>,
            #endif
            #if USEGBUFFER
                @location(2) worldNormal: vec4<f32>,
                @location(3) material: vec4<f32>,
            #endif
        };

        @group(1) @binding(0)
        var baseMapSampler: sampler;
        @group(1) @binding(1)
        var baseMap: texture_2d<f32>;

        @fragment
fn FragMain(in: FragmentInput) -> FragmentOutput {
    var out: FragmentOutput;
    out.worldPos = in.worldPos;
    out.color = textureSample(baseMap, baseMapSampler, in.uv) * in.color;
    return out;
}