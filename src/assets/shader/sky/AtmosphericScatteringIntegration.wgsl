// the max distance to ray march in meters
var<private> defaultTMaxMax: f32 = 9000000.0;
var<private> PLANET_RADIUS_OFFSET: f32 = 0.01;

// Sample per pixel for ray marching
// 16.0 without clouds
// 128.0 for thicker atmosphere
// 256.0 for clouds
var<private> RayMarchMinMaxSPP: vec2<f32> = vec2<f32>(1.0, 16.0);
var<private> RayMarchMinMaxSPPCloud: vec2<f32> = vec2<f32>(1.0, 256.0);
var<private> MULTI_SCATTERING_POWER_SERIE: u32 = 1;
var<private> MULTISCATAPPROX_ENABLED: u32 = 1;
var<private> SHADOWMAP_ENABLED: u32 = 0;
var<private> VOLUMETRIC_SHADOW_ENABLED: u32 = 1;
var<private> MultiScatteringLUTRes: f32 = 32.0;

struct SingleScatteringResult {
    L: vec3<f32>,                        // Scattered light (luminance)
    OpticalDepth: vec3<f32>,             // Optical depth (1/m)
    Transmittance: vec3<f32>,            // Transmittance in [0,1] (unitless)
    MultiScatAs1: vec3<f32>,
    NewMultiScatStep0Out: vec3<f32>,
    NewMultiScatStep1Out: vec3<f32>,
};

var<private> SunLuminance: vec3<f32> = vec3<f32>(1000000.0); // arbitrary. But fine, not use when comparing the models

struct AtmosphereParameters {
    BottomRadius: f32,
    TopRadius: f32,

    RayleighDensityExpScale: f32,
    RayleighScattering: vec3<f32>,

    MieDensityExpScale: f32,
    MieScattering: vec3<f32>,
    MieExtinction: vec3<f32>,
    MieAbsorption: vec3<f32>,
    MiePhaseG: f32,

    AbsorptionDensity0LayerWidth: f32,
    AbsorptionDensity0ConstantTerm: f32,
    AbsorptionDensity0LinearTerm: f32,
    AbsorptionDensity1ConstantTerm: f32,
    AbsorptionDensity1LinearTerm: f32,
    AbsorptionExtinction: vec3<f32>,

    GroundAlbedo: vec3<f32>,

    CloudBaseHeight: f32,
    CloudTopHeight: f32,
    CloudScattering: vec3<f32>,
    CloudAbsorption: vec3<f32>,
    CloudPhaseG: f32,
    CloudK: f32,
};

struct MediumSampleRGB {
    scattering: vec3<f32>,
    absorption: vec3<f32>,
    extinction: vec3<f32>,

    scatteringMie: vec3<f32>,
    absorptionMie: vec3<f32>,
    extinctionMie: vec3<f32>,

    scatteringRay: vec3<f32>,
    absorptionRay: vec3<f32>,
    extinctionRay: vec3<f32>,

    scatteringOzo: vec3<f32>,
    absorptionOzo: vec3<f32>,
    extinctionOzo: vec3<f32>,

    scatteringCloud: vec3<f32>,
    absorptionCloud: vec3<f32>,
    extinctionCloud: vec3<f32>,

    albedo: vec3<f32>,
};

fn ComputeSphereNormal(coord: vec2<f32>, phiStart: f32, phiLength: f32, thetaStart: f32, thetaLength: f32) -> vec3<f32> {
    var normal: vec3<f32>;
    normal.x = -sin(thetaStart + coord.y * thetaLength) * sin(phiStart + coord.x * phiLength);
    normal.y = -cos(thetaStart + coord.y * thetaLength);
    normal.z = -sin(thetaStart + coord.y * thetaLength) * cos(phiStart + coord.x * phiLength);
    return normalize(normal);
}

fn raySphereIntersectNearest(r0: vec3<f32>, rd: vec3<f32>, s0: vec3<f32>, sR: f32) -> f32 {
    var a: f32 = dot(rd, rd);
    var s0_r0: vec3<f32> = r0 - s0;
    var b: f32 = 2.0 * dot(rd, s0_r0);
    var c: f32 = dot(s0_r0, s0_r0) - (sR * sR);
    var delta: f32 = b * b - 4.0 * a * c;
    if delta < 0.0 || a == 0.0 {
        return -1.0;
    }
    var sol0: f32 = (-b - sqrt(delta)) / (2.0 * a);
    var sol1: f32 = (-b + sqrt(delta)) / (2.0 * a);
    if sol0 < 0.0 && sol1 < 0.0 {
        return -1.0;
    }
    if sol0 < 0.0 {
        return max(0.0, sol1);
    } else if sol1 < 0.0 {
        return max(0.0, sol0);
    }
    return max(0.0, min(sol0, sol1));
}

fn CornetteShanksMiePhaseFunction(g: f32, cosTheta: f32) -> f32 {
    var k: f32 = 3.0 / (8.0 * PI) * (1.0 - g * g) / (2.0 + g * g);
    return k * (1.0 + cosTheta * cosTheta) / pow(1.0 + g * g - 2.0 * g * -cosTheta, 1.5);
}

fn RayleighPhase(cosTheta: f32) -> f32 {
    var factor: f32 = 3.0 / (16.0 * PI);
    return factor * (1.0 + cosTheta * cosTheta);
}

fn hgPhase(g: f32, cosTheta: f32) -> f32 {
    return CornetteShanksMiePhaseFunction(g, cosTheta);
}

// dual-lobe hg phase 
fn dualLobeHgPhase(g: f32, cosTheta: f32, k: f32) -> f32 {
    var phase1: f32 = hgPhase(g, cosTheta);
    var phase2: f32 = hgPhase(-g, cosTheta);
    return mix(phase1, phase2, k);
}

fn LutTransmittanceParamsToUv(Atmosphere: AtmosphereParameters, viewHeight: f32, viewZenithCosAngle: f32) -> vec2<f32> {
    var H: f32 = sqrt(max(0.0, Atmosphere.TopRadius * Atmosphere.TopRadius - Atmosphere.BottomRadius * Atmosphere.BottomRadius));
    var rho: f32 = sqrt(max(0.0, viewHeight * viewHeight - Atmosphere.BottomRadius * Atmosphere.BottomRadius));

    var discriminant: f32 = viewHeight * viewHeight * (viewZenithCosAngle * viewZenithCosAngle - 1.0) + Atmosphere.TopRadius * Atmosphere.TopRadius;
    var d: f32 = max(0.0, (-viewHeight * viewZenithCosAngle + sqrt(discriminant))); // Distance to atmosphere boundary

    var d_min: f32 = Atmosphere.TopRadius - viewHeight;
    var d_max: f32 = rho + H;
    var x_mu: f32 = (d - d_min) / (d_max - d_min);
    var x_r: f32 = rho / H;

    return vec2<f32>(x_mu, x_r);
}

fn fromUnitToSubUvs(u: f32, resolution: f32) -> f32 {
    return (u + 0.5 / resolution) * (resolution / (resolution + 1.0));
}

fn fromSubUvsToUnit(u: f32, resolution: f32) -> f32 {
    return (u - 0.5 / resolution) * (resolution / (resolution - 1.0));
}

fn GetSunLuminance(WorldPos: vec3<f32>, WorldDir: vec3<f32>, PlanetRadius: f32) -> vec3<f32> {
    var sun_direction: vec3<f32> = normalize(getSunDirection());
    if dot(WorldDir, sun_direction) > cos(0.5 * 0.505 * PI / 180.0) {
        var t: f32 = raySphereIntersectNearest(WorldPos, WorldDir, vec3<f32>(0.0, 0.0, 0.0), PlanetRadius);
        if t < 0.0 { // no intersection
            return SunLuminance; // arbitrary. But fine, not use when comparing the models
    }
    }
    return vec3<f32>(0.0);
}

fn MoveToTopAtmosphere(WorldPos: ptr<function, vec3<f32>>, WorldDir: vec3<f32>, AtmosphereTopRadius: f32) -> bool {
    var viewHeight: f32 = length(*WorldPos);
    if viewHeight > AtmosphereTopRadius {
        var tTop: f32 = raySphereIntersectNearest(*WorldPos, WorldDir, vec3<f32>(0.0, 0.0, 0.0), AtmosphereTopRadius);
        if tTop >= 0.0 {
            var UpVector: vec3<f32> = *WorldPos / viewHeight;
            var UpOffset: vec3<f32> = UpVector * -0.01;
            *WorldPos = *WorldPos + WorldDir * tTop + UpOffset;
        } else {
            // Ray is not intersecting the atmosphere
            return false;
        }
    }
    return true; // ok to start tracing
}

fn getSunDirection() -> vec3<f32> {
    var sun = vec2<f32>(uniformBuffer.sunU, uniformBuffer.sunV);
    var L: vec3<f32> = ComputeSphereNormal(vec2<f32>(sun.x, sun.y), 0.0, PI_2, 0.0, PI);
    return L;
}

fn GetTransmittanceToSun(Atmosphere: AtmosphereParameters, P: vec3<f32>) -> vec3<f32> {
    var pHeight: f32 = length(P);
    var UpVector: vec3<f32> = P / pHeight;
    var SunZenithCosAngle: f32 = dot(getSunDirection(), UpVector);
    var uv = LutTransmittanceParamsToUv(Atmosphere, pHeight, SunZenithCosAngle);
    var transmittanceTextureSize = vec2<f32>(textureDimensions(transmittanceTexture, 0));
    var transmittanceTextureCoord = vec2<i32>(transmittanceTextureSize * uv);
    return textureLoad(transmittanceTexture, transmittanceTextureCoord, 0).rgb;
}

fn GetMultipleScattering(Atmosphere: AtmosphereParameters, scattering: vec3<f32>, extinction: vec3<f32>, worlPos: vec3<f32>, viewZenithCosAngle: f32) -> vec3<f32> {
    var uv = saturate(vec2<f32>(viewZenithCosAngle * 0.5 + 0.5, (length(worlPos) - Atmosphere.BottomRadius) / (Atmosphere.TopRadius - Atmosphere.BottomRadius)));
    uv = vec2<f32>(fromUnitToSubUvs(uv.x, MultiScatteringLUTRes), fromUnitToSubUvs(uv.y, MultiScatteringLUTRes));

    var multiScatteredLuminance: vec3<f32> = textureLoad(multipleScatteringTexture, vec2<i32>(uv * MultiScatteringLUTRes), 0).rgb;
    return multiScatteredLuminance;
}

fn getShadow(Atmosphere: AtmosphereParameters, P: vec3<f32>) -> f32 {
    // TODO: sample cascading shadow map
    return 1.0;
}

fn computeVolumetricShadow(WorldPos: vec3<f32>, LightDir: vec3<f32>, Atmosphere: AtmosphereParameters) -> f32 {
    var shadow: f32 = 1.0;
    var stepSize: f32 = 0.3; // Adjust based on scene scale
    var pos: vec3<f32> = WorldPos;
    for (var i: f32 = 0.0; i < 10.0; i += 1.0) { // Number of steps can be adjusted
        pos += stepSize * LightDir;
        shadow *= 1.0 - sampleCloudDensity(pos, Atmosphere);
        if (shadow < 0.05) {
            break; // Early exit for low shadow values
        }
    }
    return shadow;
}

// near: 0.01, far: 10000
fn linearizeDepth(depth: f32, near: f32, far: f32) -> f32 {
    var z: f32 = depth * 2.0 - 1.0; // Back to NDC
    return (2.0 * near * far) / (far + near - z * (far - near));
}

fn IntegrateScatteredLuminance(
    pixPos: vec2<f32>,
    WorldPos: vec3<f32>,
    WorldDir: vec3<f32>,
    SunDir: vec3<f32>,
    Atmosphere: AtmosphereParameters,
    ground: bool,
    SampleCountIni: f32,
    DepthBufferValue: f32,
    VariableSampleCount: bool,
    MieRayPhase: bool,
    tMaxMax: f32,
    resolution: vec2<f32>
) -> SingleScatteringResult {
    var debugEnabled: bool = false;
    var result: SingleScatteringResult = SingleScatteringResult(vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0), vec3<f32>(0.0));

    var ClipSpace: vec3<f32> = vec3<f32>((pixPos / resolution) * vec2<f32>(2.0, 2.0) - vec2<f32>(1.0, 1.0), 1.0);

    // Compute next intersection with atmosphere or ground
    var earthO: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    var tBottom: f32 = raySphereIntersectNearest(WorldPos, WorldDir, earthO, Atmosphere.BottomRadius);
    var tTop: f32 = raySphereIntersectNearest(WorldPos, WorldDir, earthO, Atmosphere.TopRadius);
    var tMax: f32 = 0.0;
    if tBottom < 0.0 {
        if tTop < 0.0 {
            tMax = 0.0; // No intersection with earth nor atmosphere: stop right away  
            return result;
        } else {
            tMax = tTop;
        }
    } else {
        if tTop > 0.0 {
            tMax = min(tTop, tBottom);
        }
    }

    if DepthBufferValue >= 0.0 {
        ClipSpace.z = DepthBufferValue;
        if ClipSpace.z < 1.0 {
            // TODO: use uniformBuffer.invViewProjMatrix to get the world position
            var DepthBufferWorldPos: vec4<f32> = mat4x4<f32>() * vec4<f32>(ClipSpace, 1.0);
            DepthBufferWorldPos /= DepthBufferWorldPos.w;

            var tDepth: f32 = length(DepthBufferWorldPos.xyz - (WorldPos + vec3<f32>(0.0, -Atmosphere.BottomRadius, 0.0))); // apply earth offset to go back to origin as top of earth mode. 
            tMax = min(tMax, tDepth);
        }
    }
    tMax = min(tMax, tMaxMax);

    // Sample count
    var SampleCount: f32 = SampleCountIni;
    var SampleCountFloor: f32 = SampleCountIni;
    var tMaxFloor: f32 = tMax;
    if VariableSampleCount {
        var spp: vec2<f32> = RayMarchMinMaxSPP;
        if uniformBuffer.clouds > 0.5 {
            spp = RayMarchMinMaxSPPCloud;
        }
        SampleCount = mix(spp.x, spp.y, clamp(tMax * 0.01, 0.0, 1.0));
        SampleCountFloor = floor(SampleCount);
        tMaxFloor = tMax * SampleCountFloor / SampleCount; // rescale tMax to map to the last entire step segment.
    }
    var dt: f32 = tMax / SampleCount;

    // Phase functions
    var uniformPhase: f32 = 1.0 / (4.0 * PI);
    var wi: vec3<f32> = SunDir;
    var wo: vec3<f32> = WorldDir;
    var cosTheta: f32 = dot(wi, wo);
    var MiePhaseValue: f32 = hgPhase(Atmosphere.MiePhaseG, -cosTheta); // negate cosTheta because WorldDir is an "in" direction.
    var RayleighPhaseValue: f32 = RayleighPhase(cosTheta);
    var CloudPhaseValue: f32 = dualLobeHgPhase(Atmosphere.CloudPhaseG, cosTheta, Atmosphere.CloudK);

    // #ifdef ILLUMINANCE_IS_ONE
    var globalL: vec3<f32> = vec3<f32>(1.0);
    // #else
    //   var globalL: vec3<f32> = iSunIlluminance;
    // #endif

    // Ray march the atmosphere to integrate optical depth
    var L: vec3<f32> = vec3<f32>(0.0);
    var throughput: vec3<f32> = vec3<f32>(1.0);
    var OpticalDepth: vec3<f32> = vec3<f32>(0.0);
    var t: f32 = 0.0;
    var tPrev: f32 = 0.0;
    var SampleSegmentT: f32 = 0.3;

    // TODO: improve sampling and performance inside of the cloud layer
    // compute the intersection points pointing in WorldDir direction
    var tCloudBottom: f32 = raySphereIntersectNearest(WorldPos, WorldDir, earthO, Atmosphere.BottomRadius + Atmosphere.CloudBaseHeight);
    var tCloudTop: f32 = raySphereIntersectNearest(WorldPos, WorldDir, earthO, Atmosphere.BottomRadius + Atmosphere.CloudTopHeight);

    // Ray marching loop
    for (var s: f32 = 0.0; s < SampleCount; s += 1.0) {
        if VariableSampleCount {
            var t0: f32 = s / SampleCountFloor;
            var t1: f32 = (s + 1.0) / SampleCountFloor;
            t0 = t0 * t0;
            t1 = t1 * t1;
            t0 = tMaxFloor * t0;
            if t1 > 1.0 {
                t1 = tMax;
            } else {
                t1 = tMaxFloor * t1;
            }
            t = t0 + (t1 - t0) * SampleSegmentT;
            dt = t1 - t0;
        } else {
            var NewT: f32 = tMax * (s + SampleSegmentT) / SampleCount;
            dt = NewT - t;
            t = NewT;
        }
        var P: vec3<f32> = WorldPos + t * WorldDir;

        var medium: MediumSampleRGB = sampleMediumRGB(P, Atmosphere);
        var SampleOpticalDepth: vec3<f32> = medium.extinction * dt;
        var SampleTransmittance: vec3<f32> = exp(-SampleOpticalDepth);
        OpticalDepth += SampleOpticalDepth;

        var pHeight: f32 = length(P);
        var UpVector: vec3<f32> = P / pHeight;
        var SunZenithCosAngle: f32 = dot(SunDir, UpVector);
        var uv = LutTransmittanceParamsToUv(Atmosphere, pHeight, SunZenithCosAngle);
        var transmittanceTextureSize = vec2<f32>(textureDimensions(transmittanceTexture, 0));
        var transmittanceTextureCoord = vec2<i32>(transmittanceTextureSize * uv);
        var TransmittanceToSun: vec3<f32> = textureLoad(transmittanceTexture, transmittanceTextureCoord, 0).rgb;

        var PhaseTimesScattering: vec3<f32>;
        if MieRayPhase {
            PhaseTimesScattering = medium.scatteringMie * MiePhaseValue + medium.scatteringRay * RayleighPhaseValue + medium.scatteringCloud * MiePhaseValue;
        } else {
            PhaseTimesScattering = medium.scattering * uniformPhase;
        }

        // Earth shadow
        var tEarth: f32 = raySphereIntersectNearest(P, SunDir, earthO + PLANET_RADIUS_OFFSET * UpVector, Atmosphere.BottomRadius);
        var earthShadow: f32 = 1.0;
        if tEarth >= 0.0 {
            earthShadow = 0.0;
        }

        // Dual scattering for multi scattering
        var multiScatteredLuminance: vec3<f32> = vec3<f32>(0.0);
        if MULTISCATAPPROX_ENABLED == 1 {
            multiScatteredLuminance = GetMultipleScattering(Atmosphere, medium.scattering, medium.extinction, P, SunZenithCosAngle);
        }

        var shadow: f32 = 1.0;
        if SHADOWMAP_ENABLED == 1 {
            shadow = getShadow(Atmosphere, P);
        }
        if VOLUMETRIC_SHADOW_ENABLED == 1 && uniformBuffer.clouds > 0.5 {
            shadow = computeVolumetricShadow(P, SunDir, Atmosphere);
        }

        var S: vec3<f32> = globalL * (earthShadow * shadow * TransmittanceToSun * PhaseTimesScattering + multiScatteredLuminance * medium.scattering);

        if MULTI_SCATTERING_POWER_SERIE == 0 {
            result.MultiScatAs1 += throughput * medium.scattering * 1.0 * dt;
        } else {
            var MS: vec3<f32> = medium.scattering * 1.0;
            var MSint: vec3<f32> = (MS - MS * SampleTransmittance) / medium.extinction;
            result.MultiScatAs1 += throughput * MSint;
        }

        // Evaluate input to multi scattering
        {
            var newMS: vec3<f32>;

            newMS = earthShadow * TransmittanceToSun * medium.scattering * uniformPhase * 1.0;
            result.NewMultiScatStep0Out += throughput * (newMS - newMS * SampleTransmittance) / medium.extinction;

            newMS = medium.scattering * uniformPhase * multiScatteredLuminance;
            result.NewMultiScatStep1Out += throughput * (newMS - newMS * SampleTransmittance) / medium.extinction;
        }

        var Sint: vec3<f32> = (S - S * SampleTransmittance) / medium.extinction;
        L += throughput * Sint;
        throughput *= SampleTransmittance;

        tPrev = t;
    }

    if ground && tMax == tBottom && tBottom > 0.0 {
        // Account for bounced light off the earth
        var P: vec3<f32> = WorldPos + tBottom * WorldDir;
        var pHeight: f32 = length(P);
        var UpVector: vec3<f32> = P / pHeight;
        var NdotL: f32 = clamp(dot(normalize(UpVector), normalize(SunDir)), 0.0, 1.0);
        var albedo: vec3<f32> = Atmosphere.GroundAlbedo;
        var TransmittanceToSun: vec3<f32> = GetTransmittanceToSun(Atmosphere, P);
        L += globalL * TransmittanceToSun * throughput * NdotL * albedo / PI;
    }

    result.L = L;
    result.OpticalDepth = OpticalDepth;
    result.Transmittance = throughput;
    return result;
}
