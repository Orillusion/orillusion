/**
 * @internal
 */
export let PreFilteredEnvironment_cs2: string = /*wgsl*/ `
    // input reflection buffer texture
    // sample prefiltered cube uv texture 
    // storge info to oct map 
    #include "GenerayRandomDir"
    #include "BitUtil"
    #include "MathShader"
    
    struct UniformData{
        roughness : f32 ,
        roughness1 : f32 ,
        roughness2 : f32 ,
        roughness3 : f32 ,
    }

    @group(0) @binding(0) var inputTex : texture_2d<f32>;
    @group(0) @binding(1) var outputTexture : texture_storage_2d<rgba32float, write>;//rgba32float
    @group(1) @binding(0) var<uniform> uniformData:UniformData;//rgba32float

    var<private> reflectionSize : vec2f ; 
    var<private> PROBE_SOURCESIZE : vec2f ; 
    var<private> PROBEMAP_SOURCESIZE : vec2f ; 
    var<private> aspect : vec2f ; 
    var<private> spaceV : f32 ; 
    
    var<private> i32InputFragCoord : vec2i;
    var<private> PI_2 : f32 = 3.1415926 * 2.0 ;
    var<private> PI : f32 = 3.1415926 ;
    var<private> RAYS_PER_PROBE : f32 = 32.0 ;

    var<private> screenSize : vec2f ; 

    fn useSphereReflection(){
        reflectionSize = vec2f(textureDimensions(inputTex).xy);
        PROBE_SOURCESIZE = reflectionSize / vec2f(6.0,8.0);
        PROBEMAP_SOURCESIZE = reflectionSize ;
        aspect = PROBE_SOURCESIZE / PROBEMAP_SOURCESIZE;
        spaceV = 1.0 / 8.0;
    }

    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        var color : vec4f ;
        useSphereReflection();
        screenSize = vec2f(textureDimensions(outputTexture).xy);
        
        i32InputFragCoord = vec2<i32>( globalInvocation_id.xy ) ;
        let i = globalInvocation_id.z ;
        let roughness = uniformData.roughness ;

        let suv = vec2f(i32InputFragCoord) ;
        let subUV = vec2f((suv.x+0.5) % (256.0*6.0),(suv.y+0.5) % 256.0) / vec2f( (256.0*6.0), 256.0 ) ;
        let faceID = i32((suv.x / 256.0));
        let probeID = i32(floor(suv.y / 256.0));
        
        var sphereUV = subUV ;//(suv / screenSize) ;
        var dir: vec3<f32> = UvToDir(sphereUV) ;//* 0.5 + 0.5 ;

        var preColor = PreFilterEnvMap(roughness,dir,0.0);
        
        // var cc = vec4f(getReflectionsMap(dir,0.0),1.0) ;
        color.y = vec3fToFloat(preColor.xyz);
        color.z = vec3fToFloat(dir);
        
        textureStore(outputTexture,i32InputFragCoord,color);
    }

    fn getReflectionsMap(n:vec3<f32>,gid:f32) -> vec3f {
        var uv = getSampleProbeUV(n,gid);
        let color = textureLoad(inputTex, vec2i(uv*screenSize) , 0);
        return floatToVec3f(color.y) ;
    }

    fn getSampleProbeUV(dir:vec3<f32>,gid:f32) -> vec2<f32> {
        let faceId = dir_to_faceId(dir);
        var targetUV:vec2<f32> = convert_xyz_to_cube_uv(dir.x, dir.y, dir.z);
        targetUV.x = 1.0 - targetUV.x;
        // targetUV.y = 1.0 - targetUV.y;
        let threshould = 0.5 / PROBE_SOURCESIZE;
        targetUV = clamp(targetUV, vec2<f32>(threshould), vec2<f32>(1.0 - threshould));
     
        targetUV.x = f32(faceId) + targetUV.x;
     
        let aspect:vec2f = PROBE_SOURCESIZE / PROBEMAP_SOURCESIZE;
        targetUV = targetUV * aspect ;

        targetUV.y = targetUV.y + (spaceV*gid);
     
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

const NUM_SAMPLES = 512u;
fn PreFilterEnvMap( roughness2:f32,  R:vec3f , gid:f32 ) -> vec3f
{
    var res = vec3f(0.0f);  
    var totalWeight = 0.0f;   
     
    var normal = normalize(R);
    var toEye = normal;
     
    var roughness = roughness2;
    //roughness = max(0.02f,roughness);
     
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
            // res += sampleBuffer(lightVec,gid).rgb *NdotL;
            res += vec3f(getReflectionsMap(lightVec,0.0)) * NdotL;;
            totalWeight += NdotL;


            // var uv = convert_xyz_to_cube_uv(lightVec.x,lightVec.y,lightVec.z) ;

            // // let uv_f32:vec2<f32> = subUV * vec2f(256.0*6.0,256.0*8.0);
            // var bc = textureLoad(inputTex, vec2i(uv) , 0);

            // res += floatToVec3f(bc.y) ; 
            // totalWeight += 1.0;
        }
    }
     
    return res / max(totalWeight,0.001f);
} 

fn  specularD( roughness:f32,  NoH:f32) -> f32
{
    var NoH2 = NoH * NoH;
    var r2 = roughness * roughness;
    return r2 / pow(NoH2 * (r2 - 1.0) + 1.0, 2.0);
}
    
`

// var sphereUV = (suv / screenSize) ;
// var dir: vec3<f32> = UvToDir(sphereUV) ;//* 0.5 + 0.5 ;
// var negUV: vec2<f32> = DirTOUV(dir) ;//* 0.5 + 0.5 ;

// var cc = vec4f(getReflectionsMap(dir,0.0),1.0) ;
// color.y = vec3fToFloat(cc.xyz);
// color.z = vec3fToFloat(dir);

// textureStore(outputTexture,i32InputFragCoord,color);