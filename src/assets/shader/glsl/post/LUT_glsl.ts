/**
 * @internal
 */
export let LUT_glsl = `
#version 450

layout(location = 0) in vec2 fragUV;

layout(location = 0) out vec4 o_Target;

layout(set = 0, binding = 0) uniform ConstUniform {
    mat4 projMat;
    mat4 viewMat;
    mat4 shadowMatrix;
    mat4 cameraWorldMatrix ;
    mat4 pvMatrixInv ;
    float frame;
    float time;
    float detail;
    float shadowBias;
    float skyExposure;
    float renderPassState;
    float quadScale;
    float intensity;
};

layout(set = 2, binding = 0) uniform sampler baseMapSampler;
layout(set = 2, binding = 1) uniform texture2D baseMap;

layout(set = 2, binding = 2) uniform sampler lutMapSample;
layout(set = 2, binding = 3) uniform texture2D lutMap;

layout(set = 3, binding = 0) uniform UniformData{
    float intensity ;
};

void main() {
    vec2 uv = fragUV.xy;
    uv.y = 1.0 - uv.y;
    vec4 col = texture(sampler2D(baseMap, baseMapSampler), uv * quadScale);
    // vec3 col = vec3(pow(base.xyz,vec3(1.0/2.2)));

    float Bcolor = col.b * 63.0;
	vec2 quad1;
    quad1.y = floor(floor(Bcolor) / 8.0);
    quad1.x = floor(Bcolor) - (quad1.y * 8.0);

    vec2 quad2;
    quad2.y = floor(ceil(Bcolor) / 8.0);
    quad2.x = ceil(Bcolor) - (quad2.y * 8.0);

    const float tmp = (0.125-(0.5/512.0)) ;
    const float tmp2 = 0.5/512.0 ;

    vec2 uv1;
    vec2 uv2;
	uv1.x = ((quad1.x)*0.125)+ tmp2 + (tmp* col.r);
	uv1.y = (((quad1.y)*0.125) + tmp2 + (tmp* col.g));

	uv2.x = ((quad2.x)*0.125)+ tmp2 + (tmp* col.r);
	uv2.y = (((quad2.y)*0.125)+ tmp2 + (tmp* col.g));

    vec4 color1 = texture(sampler2D(lutMap, lutMapSample), uv1);
    vec4 color2 = texture(sampler2D(lutMap, lutMapSample), uv2);

    vec4 newColor = mix(color1, color2, fract(Bcolor));
    // vec3 outC = pow(newColor.xyz,vec3(2.2));

    o_Target = vec4(newColor.rgb, col.a );
    // o_Target = vec4(1.0);
}
`;
