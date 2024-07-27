/**
 * @internal
 */
export let GlobalFog_shader = /* wgsl */ `
    var<private> PI: f32 = 3.14159265359;
    #include "GlobalUniform"
    #include "GBufferStand" 
    
    struct LightData {
        index:f32,
        lightType:i32,
        radius:f32,
        linear:f32,
        
        position:vec3<f32>,
        lightMatrixIndex:f32,

        direction:vec3<f32>,
        quadratic:f32,

        lightColor:vec3<f32>,
        intensity:f32,

        innerCutOff :f32,
        outerCutOff:f32,
        range :f32,
        castShadow:i32,

        lightTangent:vec3<f32>,
        ies:f32,
    };

    struct FogUniformData {
        fogColor : vec4<f32>,
        
        fogType : f32 ,
        fogHeightScale : f32 , 
        start: f32,
        end: f32,

        density : f32 ,
        ins : f32 ,
        falloff : f32 ,
        rayLength : f32 ,

        scatteringExponent : f32 ,
        dirHeightLine : f32 ,
        skyFactor: f32,
        skyRoughness: f32,

        overrideSkyFactor: f32,
        isSkyHDR: f32,
        slot0: f32,
        slot1: f32,
    };


    @group(0) @binding(2) var<uniform> fogUniform: FogUniformData;
    @group(0) @binding(3) var<storage,read> lightBuffer: array<LightData>;
    @group(0) @binding(4) var inTex: texture_2d<f32>;
    @group(0) @binding(5) var prefilterMap: texture_cube<f32>;
    @group(0) @binding(6) var prefilterMapSampler: sampler;
    @group(0) @binding(7) var outTex : texture_storage_2d<rgba16float, write>;

    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> fragUV: vec2<f32>;

    var<private> texPosition: vec4<f32>;
    var<private> texNormal: vec4<f32>;
    var<private> texColor: vec4<f32>;

    fn getGroundWithSkyColor(worldPosition:vec3<f32>, skyRoughness:f32, isHDRTexture:bool) -> vec3<f32>
    {
        let rayDirection = normalize(vec3<f32>(worldPosition.xyz - globalUniform.CameraPos.xyz));
        let calcRoughness = clamp(skyRoughness, 0.0, 1.0);
        let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
        var prefilterColor = textureSampleLevel(prefilterMap, prefilterMapSampler, rayDirection, calcRoughness * MAX_REFLECTION_LOD);
        if(isHDRTexture){
            prefilterColor = vec4<f32>(LinearToGammaSpace(vec3<f32>(prefilterColor.xyz)), prefilterColor.w);
        }
        return prefilterColor.xyz * globalUniform.skyExposure;
    }

    fn getSkyBluredColor(skyRoughness:f32, isHDRTexture:bool) -> vec3<f32>
    {
        var worldPosition = vec4f(getSkyPositionFromGBuffer(fragUV), 1.0);
        let rayDirection = normalize(vec3<f32>(worldPosition.xyz - globalUniform.CameraPos.xyz));
        let calcRoughness = clamp(skyRoughness, 0.0, 1.0);
        let MAX_REFLECTION_LOD  = f32(textureNumLevels(prefilterMap)) ;
        var prefilterColor = textureSampleLevel(prefilterMap, prefilterMapSampler, rayDirection, calcRoughness * MAX_REFLECTION_LOD);
        if(isHDRTexture){
            prefilterColor = vec4<f32>(LinearToGammaSpace(vec3<f32>(prefilterColor.xyz)), prefilterColor.w);
        }
        return prefilterColor.xyz * globalUniform.skyExposure;
    }

    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        fragCoord = vec2<i32>( globalInvocation_id.xy );
        texSize = textureDimensions(inTex).xy;
        if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
            return;
        }

        fragUV = vec2<f32>(fragCoord) / vec2<f32>(texSize - 1);

        var gBuffer = getGBuffer( fragCoord ) ;
        texNormal = vec4f(getWorldNormalFromGBuffer(gBuffer),1.0); 
        texPosition =  vec4f(getWorldPositionFromGBuffer(gBuffer,fragUV), 1.0);
        texColor = textureLoad(inTex, fragCoord, 0);
    
        var opColor = vec3<f32>(0.0);
        if(getRoughnessFromGBuffer(gBuffer) <= 0.0){
            //for sky
            if(fogUniform.overrideSkyFactor > 0.01){
                opColor = blendSkyColor();
            }else{
                opColor = texColor.xyz;
            }
        }else{
            //for ground
            var fogFactor = calcFogFactor();
            if(fogUniform.skyFactor > 0.01 || fogUniform.overrideSkyFactor > 0.01){
                opColor = blendGroundColor(fogFactor);
            }else{
            }
            
            opColor = mix(texColor.rgb, fogUniform.fogColor.xyz, fogFactor);
            let sunLight = lightBuffer[0] ;
            var inScatteringValue = inScatterIng(sunLight.direction, texPosition.xyz, sunLight.lightColor);
            opColor += inScatteringValue;
        }

        textureStore(outTex, fragCoord , vec4<f32>(opColor.xyz, texColor.a));
    }

    fn calcFogFactor() -> f32 
    {
        var cameraPos = globalUniform.cameraWorldMatrix[3].xyz  ;
        let dis = distance(cameraPos, texPosition.xyz);
        var heightFactor = computeFog(dis) + cFog(-texPosition.y);
        return clamp(fogUniform.ins * heightFactor,0.0,1.0);
    }

        
    fn blendGroundColor(fogFactor:f32) -> vec3<f32>
    {
        var skyColorBlur = getGroundWithSkyColor(texPosition.xyz, fogUniform.skyRoughness, fogUniform.isSkyHDR > 0.5);
        let skyFactor = clamp(fogUniform.skyFactor - fogUniform.overrideSkyFactor * 0.5, 0.0, 1.0);
        var fogColor = mix(fogUniform.fogColor.xyz, skyColorBlur, skyFactor);
        return mix(texColor.rgb, fogColor.rgb, fogFactor);
    }

    fn blendSkyColor() -> vec3<f32>
    {
        let overrideSkyFactor = sqrt(fogUniform.overrideSkyFactor);
        var skyColorBlur = getSkyBluredColor(overrideSkyFactor * 0.3, fogUniform.isSkyHDR > 0.5);
        return mix(fogUniform.fogColor.xyz, skyColorBlur, 1.0 - overrideSkyFactor);
    }


    fn computeFog(z:f32) -> f32 
    {
        var fog = 0.0;
        if( fogUniform.fogType < 0.5 ){
            fog = (fogUniform.end - z) / (fogUniform.end - fogUniform.start);
        }else if(fogUniform.fogType < 1.5 ){
            fog = exp2(-fogUniform.density * z);
        }else if(fogUniform.fogType == 2.5 ){
            fog = fogUniform.density * z;
            fog = exp2(-fog * fog);
        }
        return max(fog,0.0);
    }

    fn cFog(y:f32) -> f32 
    {
        let fogDensity = fogUniform.density * exp(fogUniform.fogHeightScale * y);
        let fogFactor = (1.0 - exp2(-fogUniform.falloff)) / fogUniform.falloff ;
        let fog = fogDensity * fogFactor * max(fogUniform.rayLength - fogUniform.start, 0.0); 
        return max(fog,0.0);
    }

    fn inScatterIng(sunDir:vec3<f32>, worldPos:vec3<f32>, sunColor:vec3<f32>) -> vec3<f32> 
    {
        let viewDir = normalize(globalUniform.CameraPos.xyz - worldPos.xyz) ;
        let VoL = saturate(dot(viewDir,sunDir)) ;
        var scatter = pow(VoL,fogUniform.scatteringExponent);
        scatter *= (1.0-saturate(exp2(-fogUniform.dirHeightLine)));
        return vec3<f32>(scatter*sunColor);
    }

`;


