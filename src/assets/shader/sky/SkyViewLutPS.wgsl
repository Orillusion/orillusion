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
var<private> texSize: vec2<f32>;
var<private> PI: f32 = 3.1415926535897932384626433832795;
var<private> PI_2: f32 = 0.0;
var<private> EPSILON:f32 = 0.0000001;
var<private> NONLINEARSKYVIEWLUT: bool = true;

@compute @workgroup_size(8, 8, 1)
fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(global_invocation_id) globalInvocation_id: vec3<u32>) {
    fragCoord = vec2<i32>(globalInvocation_id.xy);
    texSize = vec2<f32>(uniformBuffer.width, uniformBuffer.height);
    uv01 = vec2<f32>(globalInvocation_id.xy) / texSize;
    uv01.y = 1.0 - uv01.y - EPSILON;
    PI_2 = PI * 2.0;
    textureStore(outTexture, fragCoord, SkyViewLutPS(vec2<f32>(fragCoord), uv01));//vec4(uv01, 0.0, 1.0));
}

fn UvToSkyViewLutParams(Atmosphere: AtmosphereParameters, viewHeight: f32, uv0: vec2<f32>) -> vec2<f32> {
    // Constrain uvs to valid sub texel range (avoid zenith derivative issue making LUT usage visible)
    var uv = vec2<f32>(fromSubUvsToUnit(uv0.x, 192.0), fromSubUvsToUnit(uv0.y, 108.0));

    var Vhorizon: f32 = sqrt(viewHeight * viewHeight - Atmosphere.BottomRadius * Atmosphere.BottomRadius);
    var CosBeta: f32 = Vhorizon / viewHeight; // GroundToHorizonCos
    var Beta: f32 = acos(CosBeta);
    var ZenithHorizonAngle: f32 = PI - Beta;
    var viewZenithCosAngle: f32;

    if uv.y < 0.5 {
        var coord: f32 = 2.0 * uv.y;
        coord = 1.0 - coord;
        if NONLINEARSKYVIEWLUT {
            coord = coord * coord;
        }
        coord = 1.0 - coord;
        viewZenithCosAngle = cos(ZenithHorizonAngle * coord);
    } else {
        var coord: f32 = uv.y * 2.0 - 1.0;
        if NONLINEARSKYVIEWLUT {
            coord = coord * coord;
        }
        viewZenithCosAngle = cos(ZenithHorizonAngle + Beta * coord);
    }

    var coord: f32 = uv.x;
    coord = coord * coord;
    var lightViewCosAngle: f32 = -(coord * 2.0 - 1.0);

    return vec2<f32>(viewZenithCosAngle, lightViewCosAngle);
}


fn SkyViewLutPS(pixPos: vec2<f32>, uv: vec2<f32>) -> vec4<f32> {
    var Atmosphere: AtmosphereParameters = GetAtmosphereParameters();

    // var ClipSpace: vec3<f32> = vec3<f32>((pixPos / vec2<f32>(192.0, 108.0)) * vec2<f32>(2.0, -2.0) - vec2<f32>(1.0, -1.0), 1.0);
    // var HViewPos: vec4<f32> = uniformBuffer.skyInvProjMat * vec4<f32>(ClipSpace, 1.0);
    // var m = uniformBuffer.skyInvViewMat;
    // var WorldDir: vec3<f32> = normalize((mat3x3<f32>(m[0].xyz, m[1].xyz, m[2].xyz) * HViewPos.xyz) / HViewPos.w);
    var WorldPos: vec3<f32> = vec3<f32>(0, Atmosphere.BottomRadius + uniformBuffer.eyePos + 0.01, 0);

    var viewHeight: f32 = length(WorldPos);

    var lutParams = UvToSkyViewLutParams(Atmosphere, viewHeight, uv);
    var viewZenithCosAngle: f32 = lutParams.x;
    var lightViewCosAngle: f32 = lutParams.y;

    var sun = vec2<f32>(uniformBuffer.sunU, uniformBuffer.sunV);
    var sun_direction: vec3<f32> = ComputeSphereNormal(vec2<f32>(sun.x, sun.y), 0.0, PI_2, 0.0, PI);

    var SunDir: vec3<f32>;
        {
        var UpVector: vec3<f32> = WorldPos / viewHeight;
        var sunZenithCosAngle: f32 = dot(UpVector, sun_direction);
        SunDir = normalize(vec3<f32>(sqrt(1.0 - sunZenithCosAngle * sunZenithCosAngle), 0.0, sunZenithCosAngle));
    }

    WorldPos = vec3<f32>(0.0, 0.0, viewHeight);

    var viewZenithSinAngle: f32 = sqrt(1.0 - viewZenithCosAngle * viewZenithCosAngle);
    var WorldDir = vec3<f32>(
        viewZenithSinAngle * lightViewCosAngle,
        viewZenithSinAngle * sqrt(1.0 - lightViewCosAngle * lightViewCosAngle),
        viewZenithCosAngle
    );

    // Move to top atmosphere
    if !MoveToTopAtmosphere(&WorldPos, WorldDir, Atmosphere.TopRadius) {
        // Ray is not intersecting the atmosphere
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    const ground: bool = false;
    const SampleCountIni: f32 = 30.0;
    const DepthBufferValue: f32 = -1.0;
    const VariableSampleCount: bool = true;
    const MieRayPhase: bool = true;
    var texSize = vec2<f32>(uniformBuffer.width, uniformBuffer.height);
    var ss: SingleScatteringResult = IntegrateScatteredLuminance(
        pixPos, WorldPos, WorldDir, SunDir, Atmosphere,
        ground, SampleCountIni, DepthBufferValue, VariableSampleCount,
        MieRayPhase, defaultTMaxMax, texSize
    );

    var L: vec3<f32> = ss.L;

    return vec4<f32>(L, 1.0);
}
