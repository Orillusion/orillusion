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

var<private> uv01: vec2<f32>;
var<private> fragCoord: vec2<i32>;
var<private> texSizeF32: vec2<f32>;
var<private> PI: f32 = 3.1415926535897932384626433832795;
var<private> PI_2: f32 = 0.0;
var<private> EPSILON:f32 = 0.0000001;

@compute @workgroup_size(8, 8, 1)
fn CsMain(@builtin(workgroup_id) workgroup_id: vec3<u32>, @builtin(global_invocation_id) globalInvocation_id: vec3<u32>) {
    fragCoord = vec2<i32>(globalInvocation_id.xy);
    texSizeF32 = vec2<f32>(uniformBuffer.width, uniformBuffer.height);
    uv01 = vec2<f32>(globalInvocation_id.xy) / texSizeF32;
    uv01.y = 1.0 - uv01.y - EPSILON;
    PI_2 = PI * 2.0;
    uv01 *= vec2<f32>(10., 10.);
    var coord = vec3<f32>(uv01, 1.0);
    var noiseValue = 1. - worleyNoise3D(coord);
    var outColor = vec4<f32>(noiseValue, noiseValue, noiseValue, 1.);
    textureStore(outTexture, fragCoord, outColor);
}

fn worleyNoise3D(pos: vec3<f32>) -> f32 {
    var minDist: f32 = 1.0;  // Large number to start with
    for (var z: i32 = -1; z <= 1; z++) {
        for (var y: i32 = -1; y <= 1; y++) {
            for (var x: i32 = -1; x <= 1; x++) {
                var cell = floor(pos) + vec3<f32>(f32(x), f32(y), f32(z));
                var point = cell + hash3D(cell);  // hash3D is a function you need to define
                var dist = distance(pos, point);
                minDist = min(minDist, dist);
            }
        }
    }
    return minDist;
}

fn hash3D(p: vec3<f32>) -> vec3<f32> {
    // Simple hash function, replace with a better one if needed
    return fract(sin(vec3<f32>(dot(p, vec3<f32>(127.1, 311.7, 74.7)), dot(p, vec3<f32>(269.5, 183.3, 246.1)), dot(p, vec3<f32>(113.5, 271.9, 124.6)))) * 43758.5453);
}