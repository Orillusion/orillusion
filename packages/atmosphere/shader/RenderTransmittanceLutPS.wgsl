#include 'AtmosphereEarth'
#include 'AtmosphericScatteringIntegration'
#include 'AtmosphereUniforms'

@group(0) @binding(0) var<uniform> uniformBuffer: UniformData;
@group(0) @binding(1) var outTexture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(auto) var transmittanceTexture: texture_2d<f32>;
@group(0) @binding(auto) var transmittanceTextureSampler: sampler;
@group(0) @binding(auto) var multipleScatteringTexture: texture_2d<f32>;
@group(0) @binding(auto) var multipleScatteringTextureSampler: sampler;
@group(0) @binding(auto) var cloudTextureSampler: sampler;
@group(0) @binding(auto) var cloudTexture: texture_2d<f32>;

var<private> uv01: vec2<f32>;
var<private> fragCoord: vec2<i32>;
var<private> texSizeF32: vec2<f32>;
var<private> PI: f32 = 3.1415926535897932384626433832795;
var<private> PI_2: f32 = 0.0;
var<private> EPSILON:f32 = 0.0000001;

@compute @workgroup_size(8 , 8 , 1)
fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(global_invocation_id) globalInvocation_id: vec3<u32>) {
    fragCoord = vec2<i32>(globalInvocation_id.xy);
    texSizeF32 = vec2<f32>(uniformBuffer.width, uniformBuffer.height);
    uv01 = vec2<f32>(globalInvocation_id.xy) / texSizeF32;
    uv01.y = 1.0 - uv01.y - EPSILON;
    PI_2 = PI * 2.0;
    textureStore(outTexture, fragCoord, RenderTransmittanceLutPS(vec2<f32>(fragCoord), uv01));//vec4(uv01, 0.0, 1.0));
}

struct UvToLutResult {
    viewHeight: f32,
    viewZenithCosAngle: f32,
};

fn UvToLutTransmittanceParams(Atmosphere: AtmosphereParameters, uv: vec2<f32>) -> UvToLutResult {
    var result: UvToLutResult;

    var x_mu: f32 = uv.x;
    var x_r: f32 = uv.y;

    var H: f32 = sqrt(Atmosphere.TopRadius * Atmosphere.TopRadius - Atmosphere.BottomRadius * Atmosphere.BottomRadius);
    var rho: f32 = H * x_r;
    result.viewHeight = sqrt(rho * rho + Atmosphere.BottomRadius * Atmosphere.BottomRadius);

    var d_min: f32 = Atmosphere.TopRadius - result.viewHeight;
    var d_max: f32 = rho + H;
    var d: f32 = d_min + x_mu * (d_max - d_min);
    result.viewZenithCosAngle = (H * H - rho * rho - d * d) / (2.0 * result.viewHeight * d);
    if d == 0.0 {
        result.viewZenithCosAngle = 1.0;
    }
    result.viewZenithCosAngle = clamp(result.viewZenithCosAngle, -1.0, 1.0);

    return result;
}

fn RenderTransmittanceLutPS(pixPos: vec2<f32>, uv: vec2<f32>) -> vec4<f32> {
    var Atmosphere: AtmosphereParameters = GetAtmosphereParameters();
    var transmittanceParams: UvToLutResult = UvToLutTransmittanceParams(Atmosphere, uv);

    var WorldPos: vec3<f32> = vec3<f32>(0.0, 0.0, transmittanceParams.viewHeight);
    var WorldDir: vec3<f32> = vec3<f32>(0.0, sqrt(1.0 - transmittanceParams.viewZenithCosAngle * transmittanceParams.viewZenithCosAngle), transmittanceParams.viewZenithCosAngle);

    var ground = false;
    var SampleCountIni = 40.0;	// Can go a low as 10 sample but energy lost starts to be visible.
    var DepthBufferValue = -1.0;
    var VariableSampleCount = false;
    var MieRayPhase = false;

    var scatteringResult: SingleScatteringResult = IntegrateScatteredLuminance(pixPos, WorldPos, WorldDir, getSunDirection(), Atmosphere, ground, SampleCountIni, DepthBufferValue, VariableSampleCount, MieRayPhase, defaultTMaxMax, texSizeF32);
    var transmittance: vec3<f32> = exp(-scatteringResult.OpticalDepth);

    // Optical depth to transmittance
    return vec4<f32>(transmittance, 1.0);
}
