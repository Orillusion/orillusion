fn GetAtmosphereParameters() -> AtmosphereParameters {
  var info: AtmosphereParameters;

  let EarthBottomRadius: f32 = 6360.0;
  var scalar: f32 = 1.0; // TODO: control with uniform
  var EarthTopRadius: f32 = EarthBottomRadius + 100.0 * scalar;
  var EarthRayleighScaleHeight: f32 = 8.0 * scalar;
  var EarthMieScaleHeight: f32 = 1.2 * scalar;

  info.BottomRadius = EarthBottomRadius;
  info.TopRadius = EarthTopRadius;
  info.GroundAlbedo = vec3<f32>(1.0, 1.0, 1.0);

  info.RayleighDensityExpScale = -1.0 / EarthRayleighScaleHeight;
  info.RayleighScattering = vec3<f32>(0.005802, 0.013558, 0.033100);

  info.MieDensityExpScale = -1.0 / EarthMieScaleHeight;
  info.MieScattering = vec3<f32>(0.003996, 0.003996, 0.003996);
  info.MieExtinction = vec3<f32>(0.004440, 0.004440, 0.004440);
  info.MieAbsorption = info.MieExtinction - info.MieScattering;
  info.MiePhaseG = 0.8;

  info.AbsorptionDensity0LayerWidth = 25.0 * scalar;
  info.AbsorptionDensity0ConstantTerm = -2.0 / 3.0;
  info.AbsorptionDensity0LinearTerm = 1.0 / (15.0 * scalar);
  info.AbsorptionDensity1ConstantTerm = 8.0 / 3.0;
  info.AbsorptionDensity1LinearTerm = -1.0 / (15.0 * scalar);
  info.AbsorptionExtinction = vec3<f32>(0.000650, 0.001881, 0.000085);

  // Cloud parameters
  info.CloudBaseHeight = 3.0; // Base height of clouds in km
  info.CloudTopHeight = 5.0; // Top height of clouds in km
  info.CloudScattering = vec3<f32>(0.9, 0.9, 0.9); // Albedo of clouds
  info.CloudAbsorption = vec3<f32>(0.001, 0.001, 0.001);
  info.CloudPhaseG = 0.8;
  info.CloudK = 0.5;

  return info;
}

fn getAlbedo(scattering: vec3<f32>, extinction: vec3<f32>) -> vec3<f32> {
  return vec3<f32>(
    scattering.x / max(0.001, extinction.x),
    scattering.y / max(0.001, extinction.y),
    scattering.z / max(0.001, extinction.z)
  );
}

fn sampleMediumRGB(WorldPos: vec3<f32>, Atmosphere: AtmosphereParameters) -> MediumSampleRGB {
  var viewHeight: f32 = length(WorldPos) - Atmosphere.BottomRadius;

  var densityMie: f32 = exp(Atmosphere.MieDensityExpScale * viewHeight);
  var densityRay: f32 = exp(Atmosphere.RayleighDensityExpScale * viewHeight);
  var clampVal: f32 = Atmosphere.AbsorptionDensity1LinearTerm * viewHeight + Atmosphere.AbsorptionDensity1ConstantTerm;
  if viewHeight < Atmosphere.AbsorptionDensity0LayerWidth {
    clampVal = Atmosphere.AbsorptionDensity0LinearTerm * viewHeight + Atmosphere.AbsorptionDensity0ConstantTerm;
  }
  var densityOzo: f32 = clamp(clampVal, 0.0, 1.0);

  var s: MediumSampleRGB;

  s.scatteringMie = densityMie * Atmosphere.MieScattering;
  s.absorptionMie = densityMie * Atmosphere.MieAbsorption;
  s.extinctionMie = densityMie * Atmosphere.MieExtinction;

  s.scatteringRay = densityRay * Atmosphere.RayleighScattering;
  s.absorptionRay = vec3<f32>(0.0, 0.0, 0.0);
  s.extinctionRay = s.scatteringRay + s.absorptionRay;

  s.scatteringOzo = vec3<f32>(0.0, 0.0, 0.0);
  s.absorptionOzo = densityOzo * Atmosphere.AbsorptionExtinction;
  s.extinctionOzo = s.scatteringOzo + s.absorptionOzo;

  if uniformBuffer.enableClouds > .5 {
    var cloudDensity: f32 = sampleCloudDensity(WorldPos, Atmosphere);
    s.scatteringCloud = cloudDensity * Atmosphere.CloudScattering;
    s.absorptionCloud = cloudDensity * Atmosphere.CloudAbsorption;
    s.extinctionCloud = s.scatteringCloud + s.absorptionCloud;
  }

  s.scattering = s.scatteringMie + s.scatteringRay + s.scatteringOzo + s.scatteringCloud;
  s.absorption = s.absorptionMie + s.absorptionRay + s.absorptionOzo + s.absorptionCloud;
  s.extinction = s.extinctionMie + s.extinctionRay + s.extinctionOzo + s.extinctionCloud;
  s.albedo = getAlbedo(s.scattering, s.extinction);

  return s;
}

fn sigmoid(x: f32) -> f32 {
    return 1.0 / (1.0 + exp(-x));
}

fn sampleCloudDensity(WorldPos: vec3<f32>, Atmosphere: AtmosphereParameters) -> f32 {
    var x: f32 = length(WorldPos) - Atmosphere.BottomRadius;
    var ymin: f32 = Atmosphere.CloudBaseHeight;
    var ymax: f32 = Atmosphere.CloudTopHeight;
    var yt: f32 = 1.0;
    var baseVal: f32 = smoothstep(ymin, ymin + yt, x) * (1. - smoothstep(ymax - yt, ymax, x));
    var noiseScale: f32 = 1. / 11000.;
    var uv0: vec2<f32> = WorldPos.xz * noiseScale;
    var noiseValue: f32 = sampleCloudTexture(uv0);
    var noiseExpression: f32 = 12.;
    var noiseFactor: f32 = sigmoid(noiseValue * 2.0 * noiseExpression - noiseExpression);
    return baseVal * noiseFactor;
}

// sample the cloud texture
fn sampleCloudTexture(uv: vec2<f32>) -> f32 {
    var coords = vec2<f32>(uv * vec2<f32>(textureDimensions(cloudTexture, 0)));
    return textureSampleLevel(cloudTexture, cloudTextureSampler, coords, 0).r;
}
