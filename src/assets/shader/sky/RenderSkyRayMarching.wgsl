#include 'AtmosphereEarth'
#include 'AtmosphericScatteringIntegration'
#include 'AtmosphereUniforms'
#include 'ColorUtil'

@group(0) @binding(0) var<uniform> uniformBuffer: UniformData;
@group(0) @binding(1) var outTexture: texture_storage_2d<rgba16float, write>;

@group(0) @binding(auto) var multipleScatteringTexture: texture_2d<f32>;
@group(0) @binding(auto) var multipleScatteringTextureSampler: sampler;

@group(0) @binding(auto) var transmittanceTexture: texture_2d<f32>;
@group(0) @binding(auto) var transmittanceTextureSampler: sampler;

@group(0) @binding(auto) var cloudTextureSampler: sampler;
@group(0) @binding(auto) var cloudTexture: texture_2d<f32>;

var<private> uv01: vec2<f32>;
var<private> fragCoord: vec2<i32>;
var<private> texSize: vec2<f32>;

var<private> PI: f32 = 3.1415926535897932384626433832795;
var<private> PI_2: f32 = 0.0;
var<private> EPSILON: f32 = 0.0000001;
var<private> IS_HDR_SKY = false;

@compute @workgroup_size(8, 8, 1)
fn CsMain(@builtin(global_invocation_id) ThreadId: vec3<u32>) {
    fragCoord = vec2<i32>(ThreadId.xy);
    texSize = vec2<f32>(uniformBuffer.width, uniformBuffer.height);
    uv01 = vec2<f32>(ThreadId.xy) / texSize;
    uv01.y = 1.0 - uv01.y - EPSILON;
    PI_2 = PI * 2.0;
    textureStore(outTexture, fragCoord, mainImage(uv01, vec2<f32>(fragCoord)));
}

fn mainImage(uv: vec2<f32>, pixPos: vec2<f32>) -> vec4<f32> {
    var coords = vec2<i32>(uv * vec2<f32>(textureDimensions(multipleScatteringTexture, 0)));
    var sampleA = textureSampleLevel(multipleScatteringTexture, multipleScatteringTextureSampler, uv, 0).rgb;

    coords = vec2<i32>(uv * vec2<f32>(textureDimensions(transmittanceTexture, 0)));
    var sampleB = textureSampleLevel(transmittanceTexture, transmittanceTextureSampler, uv, 0).rgb;

    // sample the cloud texture
    coords = vec2<i32>(uv * vec2<f32>(textureDimensions(cloudTexture, 0)));
    var sampleC = textureSampleLevel(cloudTexture, cloudTextureSampler, uv, 0).rgb;

    var Atmosphere: AtmosphereParameters = GetAtmosphereParameters();

    var eyePosition = uniformBuffer.eyePos;
    var sun = vec2<f32>(uniformBuffer.sunU, uniformBuffer.sunV);
    var WorldDir: vec3<f32> = ComputeSphereNormal(uv, 0.0, PI_2, 0.0, PI);
    var SunDir: vec3<f32> = ComputeSphereNormal(vec2<f32>(sun.x, sun.y), 0.0, PI_2, 0.0, PI);
    var WorldPos = vec3(0, Atmosphere.BottomRadius + eyePosition/1000.0 + 0.01, 0);

    const ground = false;
    const SampleCountIni = 30.0;
    const DepthBufferValue = -1.0;
    const VariableSampleCount = true;
    const MieRayPhase = true;
    var result: SingleScatteringResult = IntegrateScatteredLuminance(pixPos, WorldPos, WorldDir, SunDir, Atmosphere, ground, SampleCountIni, DepthBufferValue, VariableSampleCount, MieRayPhase, defaultTMaxMax, texSize);

    // for HDR lighting
    var sky: vec3<f32>;
    if (IS_HDR_SKY) {
      sky = LinearToGammaSpace(result.L) * uniformBuffer.hdrExposure;
    } else {
      // for LDR lighting
      sky = result.L;
      sky = ACESToneMapping(sky.rgb, uniformBuffer.hdrExposure);
      sky = pow(sky.rgb, vec3<f32>(1.0/1.2)); // gamma
    }

    return vec4<f32>(sky, 1.0);
}