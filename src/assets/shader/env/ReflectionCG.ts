export let ReflectionCG: string = /* wgsl */ `
    #include 'MathShader'
    #include 'BitUtil'
    #include 'GlobalUniform'

    struct ReflectionInfo{
        gid:f32,
        worldPosition:vec3f,
        radius:f32,
        worldPosition2:vec3f,
    }

    @group(1) @binding(auto)
    var reflectionMap: texture_2d<f32>;
    @group(1) @binding(auto)
    var reflectionMapSampler: sampler;

    @group(2) @binding(8) 
    var<storage,read> reflectionBuffer : array<ReflectionInfo>;

    var<private> reflectionSize : vec2f ; 
    var<private> PROBE_SOURCESIZE : vec2f ; 
    var<private> PROBEMAP_SOURCESIZE : vec2f ; 
    var<private> aspect : vec2f ; 
    var<private> spaceV : f32 ; 

    fn useSphereReflection(){
        reflectionSize = vec2f(textureDimensions(reflectionMap).xy);
        PROBE_SOURCESIZE = vec2f(globalUniform.reflectionProbeSize);
        PROBEMAP_SOURCESIZE = vec2f(globalUniform.reflectionMapWidth,globalUniform.reflectionMapHeight) ;
        aspect = PROBE_SOURCESIZE / PROBEMAP_SOURCESIZE;
        spaceV = 1.0 / globalUniform.reflectionProbeMaxCount;
    }

    fn getSampleProbeUV(dir:vec3<f32>,gid:f32) -> vec2<f32> {
        let faceId = dir_to_faceId(dir);
        var targetUV:vec2<f32> = convert_xyz_to_cube_uv(dir.x, dir.y, dir.z);
        targetUV.x = 1.0 - targetUV.x;
        // targetUV.y = 1.0 - targetUV.y;
        let threshould = 0.5 / PROBE_SOURCESIZE;
        targetUV = clamp(targetUV, vec2<f32>(threshould), vec2<f32>(1.0 - threshould));
     
        targetUV.x = f32(faceId) + targetUV.x;
        targetUV = targetUV * aspect ;
        targetUV.y = targetUV.y + (spaceV*gid);
        return targetUV ;
     }

    //  fn getReflectionsMap(n:vec3<f32>,gid:f32) -> vec3f {
    //     var uv = getSampleProbeUV(-n,gid);
    //     let color = textureSample(reflectionMap,reflectionMapSampler,uv) ;
    //     return floatToVec3f(color.y) ;
    //  }

    const magic = vec4f(0.9852,0.99214,0.00754,0.0);
     fn getReflectionsBuffer(n:vec3<f32>,gid:f32,mip:f32) -> vec4f {
        let scaleA = vec2f(1.0/8.0,1.0/globalUniform.reflectionProbeMaxCount) ;
        let mipSource = clamp((mip * 8.0),0.0,8.0) ;
        let mip1 = floor(mipSource) ;
        let mip2 = mip1 + 1.0 ;
        let mipPect = mipSource - mip1 ;
        var uv = (octEncode(-n) + 1.0) * 0.5 * magic.xy + magic.zw ;
        var uv1 = (uv * scaleA + vec2f((mip1 * (scaleA.x)) ,0.0 ));
        var uv2 = (uv * scaleA + vec2f((mip2 * (scaleA.x)) ,0.0 ));
        let b1 = textureSampleLevel(reflectionMap,reflectionMapSampler,uv1,0.0);
        let b2 = textureSampleLevel(reflectionMap,reflectionMapSampler,uv2,0.0);
        let b1Color = b1.rgb ;
        let b2Color = b2.rgb ;

        // let rgb1 = unpack4x8unorm(u32(b1.z)).rgb ;
        // let rgb2 = unpack4x8unorm(u32(b2.z)).rgb ;

        // let m1 = unpack4x8unorm(u32(b1.w)).z ;
        // let m2 = unpack4x8unorm(u32(b2.w)).z ;

        // let b1Color = DecodeRGBM(vec4f(rgb1,m1));
        // let b2Color = DecodeRGBM(vec4f(rgb2,m2));

        // let b1D = b1.x; 
        // let b2D = b2.x; 

        let color = mix(b1Color,b2Color,vec3f(mipPect));  ;
        // let depth = mix(b1D,b2D,(mipPect)); 
        // return vec4f(color,depth) ;
        return vec4f(color,0.0) ;
     }

     fn getReflectionsEnv(reflectDir:vec3<f32>,worldPos:vec3f,mip:f32) -> vec3f{
        let maxCount = u32(globalUniform.reflectionProbeMaxCount) ;
        var nearColor = vec3f(0.0);
        if(globalUniform.reflectionCount > 0.0){
            var nearDistance = 99999.0 ;
            var nearReflectionIndex = 0u ;
            for(var i = 0u ; i < maxCount; i+=1u){
                var reflectionInfo = reflectionBuffer[i];
                let dis = length(reflectionInfo.worldPosition - worldPos) ;
                if(dis < nearDistance){
                    nearDistance = dis;
                    nearReflectionIndex = i;
                }
            }
            nearColor = getReflectionsBuffer(reflectDir,f32(nearReflectionIndex),mip).xyz;
        }else{
            nearColor = textureSampleLevel(envMap, envMapSampler, reflectDir , mip * 12.0 ).rgb ;
        }
        return nearColor ;
     }

    //  fn getReflectionsEnv(n:vec3<f32>,worldPos:vec3f,mip:f32) -> vec3f{
    //     let count = 1.0 ;//globalUniform.reflectionProbeMaxCount ;
    //     var nearColor = vec3f(0.0);
    //     var nearDistance = 99999.0 ;
    //     for(var i = 0.0 ; i < count; i+=1.0){
    //         var reflectionInfo = reflectionBuffer[i32(i)];
    //         let dis = length(reflectionInfo.worldPosition - worldPos) ;
    //         if(dis > reflectionInfo.radius){
    //             var buffer = getReflectionsBuffer(n,i,mip);
    //             var d = buffer.w;
    //             if(d <= -globalUniform.far){
    //                 d = 99999.0 - 1.0 ;
    //             }
    //             if(nearDistance > d){
    //                 nearColor = buffer.xyz;
    //                 nearDistance = d;
    //             }
    //         }else{
    //             nearColor = vec3f(1.0,0.0,0.0);
    //         }
    //     }
    //     return nearColor ;
    //  }


`