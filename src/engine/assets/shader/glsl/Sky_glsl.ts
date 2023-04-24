/**
 * @internal
 */
export let Sky_glsl_vs = `
#version 450
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 uv;

layout(location = 0) out vec2 fragUV;
layout(location = 1) out vec4 vWorldPos;
layout(location = 2) out vec3 vWorldNormal;

layout(set = 0, binding = 0) 
uniform ConstUniform {
    mat4 projMat;
    mat4 viewMat;
    mat4 shadowMatrix;
};

layout(set = 1, binding = 0) 
buffer Uniforms {
    mat4[] modeMat;
};

 mat4 inverse( in mat4 m ){
    return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz,m[3].xyz),
        -dot(m[1].xyz,m[3].xyz),
        -dot(m[2].xyz,m[3].xyz),
        1.0 );
}

void main(){
    fragUV = uv;
    mat4 modelMat = modeMat[gl_InstanceID]; 
    mat4 vm = viewMat * modelMat;
	mat3 normalMatrix = mat3(vm[0].xyz,vm[1].xyz,vm[2].xyz);
	vec3 eNormal = normalize( normalMatrix * normal );
    
    vWorldPos = modelMat * vec4(position.xyz,1.0) ;

    mat4 fixedViewMat = viewMat ;
    fixedViewMat[3] = vec4(0.0,0.0,-8.0,1.0);
    vec4 mvPosition = modelMat * vec4( position.xyz, 1.0 );
    gl_Position = projMat * fixedViewMat * mvPosition;
}

`;
/**
 * @internal
 */
export let Sky_glsl_fs = `
#version 450

layout(location = 0) in vec2 fragUV;
layout(location = 1) in vec4 vWorldPos;
layout(location = 2) in vec3 vWorldNormal;

layout(location = 0) out vec4 o_Target;

layout(set = 2, binding = 0) 
uniform sampler baseMapSampler;
layout(set = 2, binding = 1) 
uniform texture2D baseMap;

layout(set = 3, binding = 0) uniform uniformData {
    vec3 eyesPos;
    float exposure;
    float roughness;
};

vec3 LinearToGammaSpace(in vec3 linRGB)
{
    vec3 _linRGB = vec3(linRGB) ;
    _linRGB = max(linRGB, vec3(0.0, 0.0, 0.0));
    _linRGB.r = pow(linRGB.r,0.416666667);
    _linRGB.g = pow(linRGB.g,0.416666667);
    _linRGB.b = pow(linRGB.b,0.416666667);
    return max(1.055 * _linRGB - 0.055, vec3(0.0));
}

void main(){
    int maxMipLevel = textureQueryLevels(baseMap, fragUV).x ;
    vec4 textureColor = textureCubeLod( sampler2D(baseMap, baseMapSampler), normalize(vWorldPos.xyz), roughness * float(maxMipLevel) ) ;
    o_Target = vec4(LinearToGammaSpace(textureColor.rgb),1.0) * exposure ;
}

`;
