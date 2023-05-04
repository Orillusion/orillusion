export let IESProfiles_frag: string = /*wgsl*/ `
    #if USE_IES_PROFILE 
        @group(1) @binding(auto)
        var iesTextureArrayMapSampler : sampler;
        @group(1) @binding(auto)
        var iesTextureArrayMap: texture_2d_array<f32> ;
    #endif

    fn getLightIESProfileAtt( wPos : vec3<f32> , light:LightData ) -> f32
    {
        #if USE_IES_PROFILE 
            let tangent = vec3<f32>(1.0,0.0,0.0);
            let lightBitangent = normalize( cross( tangent, light.direction ) );
            let lightMatrix = mat4x4( vec4<f32>(light.direction.xyz, 0.0), vec4<f32>(lightBitangent.xyz, 0.0), vec4<f32>(tangent.xyz, 0.0), vec4<f32>(0.0, 0.0, 0.0, 1.0) );
            let lightMatrixInv = transpose(lightMatrix);
            let lightPos = models.matrix[u32(light.lightMatrixIndex)][3].xyz;
            let l = lightPos - wPos; 
            let toLight = normalize(l);
            let localToLight = (vec4<f32>(toLight.xyz, 0.0) * lightMatrixInv).xyz;
            let dotProd = dot(toLight, light.direction);
            let angle = asin(dotProd);
            let normAngle = (angle / PI) + 0.5 ;
            let tangentAngle = atan2( -localToLight.z, -localToLight.x ); 
            let normTangentAngle = tangentAngle / (PI * 2.0) + 0.5 ;
            if(light.ies >= 0.0){
                return textureSampleLevel(iesTextureArrayMap, iesTextureArrayMapSampler, vec2<f32>(normAngle , normTangentAngle) , i32(light.ies) , 0.0).r ;
            }else{
                return 1.0;
            }
        #else 
            return 1.0;
        #endif
    }

`

