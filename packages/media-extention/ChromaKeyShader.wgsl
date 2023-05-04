#include "Common_vert"
#include "Common_frag"
#include "UnLit_frag"
    
struct StandMaterial {
    transformUV1:vec4<f32>,
    transformUV2:vec4<f32>,

    baseColor: vec4<f32>,
    rectClip: vec4<f32>,

    keyColor: vec4<f32>,
    colorCutoff: f32,
    colorFeathering: f32,
    maskFeathering: f32,
    sharpening: f32,
    despoil: f32,
    despoilLuminanceAdd: f32,
};

@group(1) @binding(auto)
var baseMapSampler: sampler;
@group(1) @binding(auto)
var baseMap: texture_external;

@group(2) @binding(0)
var<uniform> materialUniform: StandMaterial;

fn vert(inputData:VertexAttributes) -> VertexOutput {
    ORI_Vert(inputData) ;
    return ORI_VertexOut ;
}

fn frag(){
    let baseColor = materialUniform.baseColor;
    let transformUV1 = materialUniform.transformUV1;
    let uv = transformUV1.zw * ORI_VertexVarying.fragUV0.xy + transformUV1.xy; 
    if(uv.x < materialUniform.rectClip.x || uv.x > (1.0-materialUniform.rectClip.z)) {
        discard;
    }
    if(uv.y < materialUniform.rectClip.y || uv.y > (1.0-materialUniform.rectClip.w)) {
        discard;
    }

    let texSize = textureDimensions(baseMap).xy;
    let color = textureLoad(baseMap, vec2<i32>( i32(uv.x * f32(texSize.x)), i32(uv.y * f32(texSize.y))) );

    let key_cb = rgb2cb(materialUniform.keyColor.rgb);
    let key_cr = rgb2cr(materialUniform.keyColor.rgb);
    let pixelWidth: vec2<f32> = vec2<f32>(1.0 / f32(texSize.x), 0);
    let pixelHeight: vec2<f32> = vec2<f32>(0, 1.0 / f32(texSize.y));

    let c = maskedTex2D(uv, texSize, key_cb, key_cr);
    let r = maskedTex2D(uv + pixelWidth, texSize, key_cb, key_cr);
    let l = maskedTex2D(uv - pixelWidth, texSize, key_cb, key_cr);
    let d = maskedTex2D(uv + pixelHeight, texSize, key_cb, key_cr); 
    let u = maskedTex2D(uv - pixelHeight, texSize, key_cb, key_cr);
    let rd = maskedTex2D(uv + pixelWidth + pixelHeight, texSize, key_cb, key_cr) * 0.707;
    let dl = maskedTex2D(uv - pixelWidth + pixelHeight, texSize, key_cb, key_cr) * 0.707;
    let lu = maskedTex2D(uv - pixelHeight - pixelWidth, texSize, key_cb, key_cr) * 0.707;
    let ur = maskedTex2D(uv + pixelWidth - pixelHeight, texSize, key_cb, key_cr) * 0.707;
    let blurContribution = (r + l + d + u + rd + dl + lu + ur + c) * 0.12774655;
    let smoothedMask = smoothstep(materialUniform.sharpening, 1, mix(c, blurContribution, materialUniform.maskFeathering));
    var result = color * smoothedMask;

    let v = (2 * result.b + result.r) / 4;
    if(result.g > v) {
        result.g = mix(result.g, v, materialUniform.despoil);
    }
    let dif = (color - result);
    let desaturatedDif = rgb2y(dif.xyz);
    result += mix(0, desaturatedDif, materialUniform.despoilLuminanceAdd);

    ORI_ShadingInput.BaseColor = result * baseColor ;
    UnLit();
}

fn rgb2cr(color: vec3<f32>) -> f32 {
    return 0.5 + color.r * 0.5 - color.g * 0.418688 - color.b * 0.081312;
}

fn rgb2y(color: vec3<f32>) -> f32 {
    return color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
}

fn rgb2cb(color: vec3<f32>) -> f32 {
    return 0.5 + color.r * -0.168736 - color.g * 0.331264 + color.b * 0.5;
}

fn colorclose(Cb_p: f32, Cr_p: f32, Cb_key: f32, Cr_key: f32, tola: f32, tolb: f32) -> f32 {
    let temp = (Cb_key - Cb_p) * (Cb_key - Cb_p) + (Cr_key - Cr_p) * (Cr_key - Cr_p);
    let tola2 = tola * tola;
    let tolb2 = tolb * tolb;
    if (temp < tola2) {
        return 0;
    }
    if (temp < tolb2) {
        return (temp - tola2) / (tolb2 - tola2);
    }
    return 1;
}

fn maskedTex2D(uv: vec2<f32>, texSize: vec2<u32>, key_cb: f32, key_cr: f32) -> f32 {
    let color = textureLoad(baseMap, vec2<i32>( i32(uv.x * f32(texSize.x)), i32(uv.y * f32(texSize.y))) );
    let pix_cb = rgb2cb(color.rgb);
    let pix_cr = rgb2cr(color.rgb);
    return colorclose(pix_cb, pix_cr, key_cb, key_cr, materialUniform.colorCutoff, materialUniform.colorFeathering);
}
