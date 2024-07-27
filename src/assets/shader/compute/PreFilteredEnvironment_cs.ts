/**
 * @internal
 */
export let PreFilteredEnvironment_cs: string = /*wgsl*/ `
    // input reflection buffer texture
    // sample prefiltered cube uv texture 
    // storge info to oct map 
    #include "GenerayRandomDir"
    #include "BitUtil"
    #include "MathShader"
    #include "ColorUtil_frag"
    
    struct UniformData{
        probeSize : f32 ,
        probeCount : f32 ,
        width : f32 ,
        height : f32 ,
    }

    @group(0) @binding(0) var inputTex : texture_2d<f32>;
    @group(0) @binding(1) var outputTexture : texture_storage_2d<rgba16float, write>;//rgba32float rgba16float
    @group(1) @binding(0) var<uniform> uniformData:UniformData;//rgba32float

    var<private> reflectionSize : vec2f ; 
    var<private> PROBE_SOURCESIZE : vec2f ; 
    var<private> PROBEMAP_SOURCESIZE : vec2f ; 
    var<private> aspect : vec2f ; 
    var<private> spaceV : f32 ; 
    
    var<private> i32InputFragCoord : vec2i;
    var<private> PI_2 : f32 = 3.1415926 * 2.0 ;
    var<private> PI : f32 = 3.1415926 ;

    var<private> probeSize : f32 = 256.0 ;
    var<private> probeCount : f32 = 8.0 ;
    var<private> faceCount : f32 = 6.0 ;
    var<private> mipCount : f32 = 8.0 ;

    const NUM_SAMPLES = 256u;
    var<private> inputSize : vec2f ; 
    var<private> outSize : vec2f ; 

    fn useSphereReflection(){
        probeSize = uniformData.probeSize ;
        probeCount = uniformData.probeCount;
        reflectionSize = vec2f(textureDimensions(inputTex).xy);
        PROBE_SOURCESIZE = reflectionSize / vec2f(faceCount,probeCount);
        PROBEMAP_SOURCESIZE = reflectionSize ;
        aspect = PROBE_SOURCESIZE / PROBEMAP_SOURCESIZE;
        spaceV = 1.0 / probeCount ;
    }

    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        var color : vec4f ;
        useSphereReflection();
        inputSize = vec2f(textureDimensions(inputTex).xy);
        outSize = vec2f(textureDimensions(outputTexture).xy);
        
        i32InputFragCoord = vec2<i32>( globalInvocation_id.xy ) ;

        let i = f32(globalInvocation_id.z) ;
        let count = floor(i / mipCount) ;
        preOneMip(count,floor(i % mipCount));
    }

    fn preOneMip( gid:f32,mip:f32 ){
        let isuv = vec2f(i32InputFragCoord) ;
        let suv = isuv * (inputSize/outSize);
        let probeID = i32(floor(suv.y / probeSize));
        let mipID = i32((isuv.x / probeSize));
        if(probeID == i32(gid) && mipID == i32(mip)){

            let sphereUV = vec2f((isuv.x+0.5) % (probeSize),(isuv.y+0.5) % probeSize) / vec2f( (probeSize), probeSize ) ;
            var dir: vec3<f32> = octDecode(sphereUV * 2.0 - 1.0) ;
            var preColor = PreFilterEnvMap(mip/mipCount + 0.05,dir,gid);
            textureStore(outputTexture,vec2i(i32InputFragCoord),preColor);
        }
    }

    fn PreFilterEnvMap( roughness2:f32,  R:vec3f , gid:f32 ) -> vec4f
    {
        var resColor = vec3f(0.0f);  
        var resDepth = 0.0;  

        var totalColorWeight = 0.0f;   
        var totalDepthWeight = 0.0f;   
        
        var normal = normalize(R);
        var toEye = normal;
        
        var roughness = roughness2;
        
        for(var i=1u;i<=NUM_SAMPLES;i+=1u)
        {
            var xi:vec2f = hammersley(i, NUM_SAMPLES) ; 
            
            var halfway = ImportanceSampleGGX(xi,roughness,normal);
            var lightVec = 2.0f * dot( toEye,halfway ) * halfway - toEye;
            
            var NdotL = dot( normal, lightVec )  ;
            var NdotH = max(0.0,dot( normal, halfway ))  ;
            var HdotV = max(0.0,dot( halfway, toEye ))  ;
            
            if( NdotL > 0.0 )
            {
                var D = specularD(roughness,NdotH);
                var pdf = (D * NdotH / (4.0 * HdotV)) + 0.0001f  ;

                var saSample = 1.0f / (f32(NUM_SAMPLES) * pdf + 0.00001f);
                lightVec = normalize(lightVec);

                var buffer = getReflectionsMap(lightVec,gid); 
                var rgb = unpack4x8unorm(u32(buffer.z)).rgb;
                var m = unpack4x8unorm(u32(buffer.w)).z;
                var rgbmColor = DecodeRGBM(vec4f(rgb,m));
                resDepth += buffer.x ;
                resColor += rgbmColor * NdotL;

                totalColorWeight += NdotL;
                totalDepthWeight += 1.0;
            }
        }

        resDepth = resDepth / max(totalDepthWeight,0.001f);
        resColor = resColor / max(totalColorWeight,0.001f);
        
        let rgbm = EncodeRGBM(resColor) ; 
        let gBuffer = vec4f(
            resDepth,
            0.0,
            f32(pack4x8unorm(vec4f(rgbm.rgb,0.0))),
            f32(pack4x8unorm(vec4f(0.0,0.0,rgbm.w,0.0))),
        ) ;
        // return gBuffer ;
        return vec4f(resColor,1.0) ;
    } 

    fn getReflectionsMap(n:vec3<f32>,gid:f32) -> vec4f {
        var uv = getSampleProbeUV(n,gid);
        let color = textureLoad(inputTex, vec2i(uv*inputSize) , 0);
        return color ;
    }

    fn getSampleProbeUV(dir:vec3<f32>,gid:f32) -> vec2<f32> {
        let faceId = dir_to_faceId(dir);
        var targetUV:vec2<f32> = convert_xyz_to_cube_uv(dir.x, dir.y, dir.z);
        targetUV.x = 1.0 - targetUV.x;
        let threshould = 0.5 / PROBE_SOURCESIZE;
        targetUV = clamp(targetUV, vec2<f32>(threshould), vec2<f32>(1.0 - threshould));
        targetUV.x = f32(faceId) + targetUV.x;
        let aspect:vec2f = PROBE_SOURCESIZE / PROBEMAP_SOURCESIZE;
        targetUV = targetUV * aspect ;
        targetUV.y = targetUV.y + (spaceV * gid);
        return targetUV ;
     }

    fn radicalInverse_VdC( bits2:u32) -> f32
    {
        var bits = bits2; 
        bits = (bits << 16u) | (bits >> 16u);
        bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
        bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
        bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
        bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
        return f32(bits) * 2.3283064365386963e-10f; // / 0x100000000
    }

    fn hammersley( i:u32, N:u32) -> vec2f
    {
        return vec2f(f32(i) / f32(N), radicalInverse_VdC(i));
    }

    fn ImportanceSampleGGX( xi:vec2f,  roughness:f32,  N:vec3f) -> vec3f
    {
        var alpha2 = roughness * roughness * roughness * roughness;
        
        var phi = 2.0f * 3.1415926 * xi.x  ;
        var cosTheta = sqrt( (1.0f - xi.y) / (1.0f + (alpha2 - 1.0f) * xi.y ));
        var sinTheta = sqrt( 1.0f - cosTheta*cosTheta );
        
        var h : vec3f ;
        h.x = sinTheta * cos( phi );
        h.y = sinTheta * sin( phi );
        h.z = cosTheta;
        
        var up = vec3f(1,0,0) ;
        if(abs(N.z) < 0.9999){
            up = vec3f(0,0,1) ;
        }

        var tangentX = normalize( cross( up, N ) );
        var tangentY = cross( N, tangentX );
        return (tangentX * h.x + tangentY * h.y + N * h.z);
    } 

    fn  specularD( roughness:f32,  NoH:f32) -> f32
    {
        var NoH2 = NoH * NoH;
        var r2 = roughness * roughness;
        return r2 / pow(NoH2 * (r2 - 1.0) + 1.0, 2.0);
    }
    
`

// var sphereUV = (suv / inputSize) ;
// var dir: vec3<f32> = UvToDir(sphereUV) ;//* 0.5 + 0.5 ;
// var negUV: vec2<f32> = DirTOUV(dir) ;//* 0.5 + 0.5 ;

// var cc = vec4f(getReflectionsMap(dir,0.0),1.0) ;
// color.y = vec3fToFloat(cc.xyz);
// color.z = vec3fToFloat(dir);

// textureStore(outputTexture,i32InputFragCoord,color);