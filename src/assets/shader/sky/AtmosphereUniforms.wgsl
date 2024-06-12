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
  enableClouds: f32,            // > 0.5: true
  hdrExposure: f32,       // = 1.0;
  skyColor: vec4<f32>,        // sky color
};