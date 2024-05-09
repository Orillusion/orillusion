#include 'AtmosphereEarth'
#include 'AtmosphericScatteringIntegration'

struct UniformData {
  width: f32,
  height: f32,
  sunU: f32,
  sunV: f32,
  eyePos: f32,
  sunRadius: f32,         // = 500.0;
  sunRadiance: f32,       // = 20.0;
  mieG: f32,              // = 0.76;
  mieHeight: f32,         // = 1200;
  sunBrightness: f32,     // = 1.0;
  displaySun: f32,        // > 0.5: true
  clouds: f32,            // > 0.5: true
  hdrExposure: f32,       // = 1.0;
  skyColor: vec4<f32>,        // sky color
};

@group(0) @binding(0) var<uniform> uniformBuffer: UniformData;
@group(0) @binding(1) var outTexture: texture_storage_2d<rgba16float, write>;
@group(0) @binding(auto) var transmittanceTexture: texture_2d<f32>;
@group(0) @binding(auto) var multipleScatteringTexture: texture_2d<f32>;
@group(0) @binding(auto) var cloudTextureSampler: sampler;
@group(0) @binding(auto) var cloudTexture: texture_2d<f32>;

var<workgroup> MultiScatAs1SharedMem: array<vec3<f32>, 64>;
var<workgroup> LSharedMem: array<vec3<f32>, 64>;

var<private> PI: f32 = 3.1415926535897932384626433832795;
var<private> PI_2: f32 = 0.0;
var<private> EPSILON: f32 = 0.0000001;
// var<private> MULTI_SCATTERING_POWER_SERIE: u32 = 1;
var<private> SQRTSAMPLECOUNT: u32 = 8;

var<private> MultipleScatteringFactor: f32 = 1.0; // change to 50 to see the texture

@compute @workgroup_size(1, 1, 64)
fn CsMain(@builtin(global_invocation_id) ThreadId: vec3<u32>) {
    var texSize = vec2<f32>(uniformBuffer.width, uniformBuffer.height);
    var pixPos: vec2<f32> = vec2<f32>(ThreadId.xy) + 0.5;
    var uv: vec2<f32> = pixPos / MultiScatteringLUTRes;

    uv = vec2<f32>(fromSubUvsToUnit(uv.x, MultiScatteringLUTRes), fromSubUvsToUnit(1. - uv.y, MultiScatteringLUTRes));

    var Atmosphere: AtmosphereParameters = GetAtmosphereParameters();

    var cosSunZenithAngle: f32 = uv.x * 2.0 - 1.0;
    var sunDir: vec3<f32> = vec3<f32>(0.0, sqrt(saturate(1.0 - cosSunZenithAngle * cosSunZenithAngle)), cosSunZenithAngle);
    var viewHeight: f32 = Atmosphere.BottomRadius + saturate(uv.y + PLANET_RADIUS_OFFSET) * (Atmosphere.TopRadius - Atmosphere.BottomRadius - PLANET_RADIUS_OFFSET);

    var WorldPos: vec3<f32> = vec3<f32>(0.0, 0.0, viewHeight);
    var WorldDir: vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);

    const ground: bool = true;
    const SampleCountIni: f32 = 20.0;
    const DepthBufferValue: f32 = -1.0;
    const VariableSampleCount: bool = false;
    const MieRayPhase: bool = false;

    var SphereSolidAngle: f32 = 4.0 * PI;
    var IsotropicPhase: f32 = 1.0 / SphereSolidAngle;


    var sqrtSample: f32 = f32(SQRTSAMPLECOUNT);
    var i: f32 = 0.5 + f32(ThreadId.z / SQRTSAMPLECOUNT);
    var j: f32 = 0.5 + f32(ThreadId.z - u32(f32(ThreadId.z / SQRTSAMPLECOUNT) * f32(SQRTSAMPLECOUNT)));
    {
        var randA: f32 = i / sqrtSample;
        var randB: f32 = j / sqrtSample;
        var theta: f32 = 2.0 * PI * randA;
        var phi: f32 = acos(1.0 - 2.0 * randB);
        var cosPhi: f32 = cos(phi);
        var sinPhi: f32 = sin(phi);
        var cosTheta: f32 = cos(theta);
        var sinTheta: f32 = sin(theta);
        WorldDir.x = cosTheta * sinPhi;
        WorldDir.y = sinTheta * sinPhi;
        WorldDir.z = cosPhi;
        var result: SingleScatteringResult = IntegrateScatteredLuminance(pixPos, WorldPos, WorldDir, sunDir, Atmosphere, ground, SampleCountIni, DepthBufferValue, VariableSampleCount, MieRayPhase, defaultTMaxMax, texSize);

        MultiScatAs1SharedMem[ThreadId.z] = result.MultiScatAs1 * SphereSolidAngle / (sqrtSample * sqrtSample);
        LSharedMem[ThreadId.z] = result.L * SphereSolidAngle / (sqrtSample * sqrtSample);
    }

    workgroupBarrier();

    if ThreadId.z < 32 {
        MultiScatAs1SharedMem[ThreadId.z] += MultiScatAs1SharedMem[ThreadId.z + 32];
        LSharedMem[ThreadId.z] += LSharedMem[ThreadId.z + 32];
    }
    workgroupBarrier();

    if ThreadId.z < 16 {
        MultiScatAs1SharedMem[ThreadId.z] += MultiScatAs1SharedMem[ThreadId.z + 16];
        LSharedMem[ThreadId.z] += LSharedMem[ThreadId.z + 16];
    }
    workgroupBarrier();

    if ThreadId.z < 8 {
        MultiScatAs1SharedMem[ThreadId.z] += MultiScatAs1SharedMem[ThreadId.z + 8];
        LSharedMem[ThreadId.z] += LSharedMem[ThreadId.z + 8];
    }
    workgroupBarrier();
    if ThreadId.z < 4 {
        MultiScatAs1SharedMem[ThreadId.z] += MultiScatAs1SharedMem[ThreadId.z + 4];
        LSharedMem[ThreadId.z] += LSharedMem[ThreadId.z + 4];
    }
    workgroupBarrier();
    if ThreadId.z < 2 {
        MultiScatAs1SharedMem[ThreadId.z] += MultiScatAs1SharedMem[ThreadId.z + 2];
        LSharedMem[ThreadId.z] += LSharedMem[ThreadId.z + 2];
    }
    workgroupBarrier();
    if ThreadId.z < 1 {
        MultiScatAs1SharedMem[ThreadId.z] += MultiScatAs1SharedMem[ThreadId.z + 1];
        LSharedMem[ThreadId.z] += LSharedMem[ThreadId.z + 1];
    }
    workgroupBarrier();
    if ThreadId.z > 0 {
        return;
    }

    var MultiScatAs1: vec3<f32> = MultiScatAs1SharedMem[0] * IsotropicPhase;
    var InScatteredLuminance: vec3<f32> = LSharedMem[0] * IsotropicPhase;

    var L: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    if MULTI_SCATTERING_POWER_SERIE == 0 {
        var MultiScatAs1SQR: vec3<f32> = MultiScatAs1 * MultiScatAs1;
        L = InScatteredLuminance * (1.0 + MultiScatAs1 + MultiScatAs1SQR + MultiScatAs1 * MultiScatAs1SQR + MultiScatAs1SQR * MultiScatAs1SQR);
    } else {
        var r: vec3<f32> = MultiScatAs1;
        var SumOfAllMultiScatteringEventsContribution: vec3<f32> = 1.0 / (1.0 - r);
        L = InScatteredLuminance * SumOfAllMultiScatteringEventsContribution;
    }

    var fragColor = vec4<f32>(MultipleScatteringFactor * L, 1.0);
    var fragCoord = vec2<i32>(ThreadId.xy);
    textureStore(outTexture, fragCoord, fragColor);
}
