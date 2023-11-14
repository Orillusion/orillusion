
export let BRDFLUT: string = /*wgsl*/ `
var<private>PI: f32 = 3.141592653589793;

// fn saturate( x : f32 ) -> f32 {
//     return clamp(x, 0.0, 1.0);
// }

fn hammersley(i : u32, N : u32) -> vec2<f32>
{
    // Radical inverse based on http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
    var bits = (i << 16u) | (i >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    var rdi = f32(bits) * 2.3283064365386963e-10;
    return vec2<f32>(f32(i) / f32(N), rdi);
}

fn G_Smith(NoV: f32, NoL : f32, roughness : f32) -> f32
{
    var k = (roughness * roughness) / 2.0;
    var GGXL = NoL / (NoL * (1.0 - k) + k);
    var GGXV = NoV / (NoV * (1.0 - k) + k);
    return GGXL * GGXV;
}

fn V_SmithGGXCorrelated(NoV: f32, NoL : f32, roughness : f32) -> f32
{
    var a2 = pow(roughness, 4.0);
    var GGXV = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
    var GGXL = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
    return 0.5 / (GGXV + GGXL);
}


// Based on Karis 2014
fn importanceSampleGGX(Xi: vec2<f32>, roughness: f32, N: vec3<f32>) -> vec3<f32>
{
    var a = roughness * roughness;
    // Sample in spherical coordinates
    var Phi = 2.0 * PI * Xi.x;
    var CosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
    var SinTheta = sqrt(1.0 - CosTheta * CosTheta);
    // Construct tangent space vector
    var H: vec3<f32>;
    H.x = SinTheta * cos(Phi);
    H.y = SinTheta * sin(Phi);
    H.z = CosTheta;

    // Tangent to world space
    var UpVector = vec3<f32>(1.0, 0.0, 0.0);
    if (abs(N.z) < 0.999) {
        UpVector = vec3<f32>(0.0, 0.0, 1.0);
    }
    var TangentX = normalize(cross(UpVector, N));
    var TangentY = cross(N, TangentX);
    return TangentX * H.x + TangentY * H.y + N * H.z;
}


// Karis 2014
fn integrateBRDF(roughness: f32, NoV: f32) -> vec2<f32>
{
    var V: vec3<f32>;
    V.x = sqrt(1.0 - NoV * NoV); // sin
    V.y = 0.0;
    V.z = NoV; // cos

    // N points straight upwards for this integration
    var N = vec3<f32>(0.0, 0.0, 1.0);

    var A = 0.0;
    var B = 0.0;
    var numSamples = 1024u;

    for (var i = 0u; i < numSamples; i += 1u) {
        var Xi = hammersley(i, numSamples);
        // Sample microfacet direction
        var H = importanceSampleGGX(Xi, roughness, N);

        // Get the light direction
        var L = 2.0 * dot(V, H) * H - V;

        var NoL = saturate(dot(N, L));
        var NoH = saturate(dot(N, H));
        var VoH = saturate(dot(V, H));

        if (NoL > 0.0) {
            var V_pdf = V_SmithGGXCorrelated(NoV, NoL, roughness) * VoH * NoL / NoH;
            var Fc = pow(1.0 - VoH, 5.0);
            A += (1.0 - Fc) * V_pdf;
            B += Fc * V_pdf;
        }
    }

    return 4.0 * vec2<f32>(A, B) / f32(numSamples);
}

@group(0) @binding(0) var brdflutTexture: texture_storage_2d<rgba8unorm, write>;
@compute @workgroup_size(8, 8, 1)
// fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(local_invocation_id) local_invocation_id : vec3<u32> ){
fn CsMain(@builtin(global_invocation_id) global_invocation_id : vec3<u32>){
    var fragCoord = vec2<u32>(global_invocation_id.x, global_invocation_id.y);

    var fragColor = vec4<f32>(0.0);
    // Output to screen
    var res = integrateBRDF(f32(fragCoord.y + 1u) / 256.0, f32(fragCoord.x + 1u) / 256.0);
    fragColor = vec4<f32>(res.x, res.y, 0.0, 1.0);

    textureStore(brdflutTexture, vec2<i32>(fragCoord.xy), fragColor);
}
`

