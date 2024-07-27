/**
 * @internal
 */
export let Combine_cs = /* wgsl */`
    #include "GlobalUniform"
    #include "BitUtil"
    #include 'ColorUtil_frag'
    #include 'GBufferStand'

    struct FrameBuffer{
        frameCount : f32 ,
        indirectIns : f32 ,
        delay : f32 ,
        colorIns : f32 ,
        d1 : f32 ,
        d2 : f32 ,
        d3 : f32 ,
        d4 : f32 ,
    }
    

    // @group(0) @binding(0) var inputATexture : texture_2d<f32>;
    // @group(0) @binding(1) var inputATextureSampler : sampler;
    @group(0) @binding(2) var inputBTexture : texture_2d<f32>;
    @group(0) @binding(3) var inputBTextureSampler : sampler;
    
    @group(0) @binding(4) var outTexture : texture_storage_2d<rgba16float, write>;
    @group(0) @binding(5) var<storage,read> updateBuffer: FrameBuffer ;

    var<private> fragCoord:vec2<u32>;

    const PI = 3.1415926 ;
    
    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        fragCoord = globalInvocation_id.xy;
        let textsize = vec2f(textureDimensions(inputBTexture).xy);
        let size = vec2f(textureDimensions(outTexture).xy);
        let inputUV = vec2f(fragCoord) / size ;
        let inputUV2 = vec2<i32>(inputUV * textsize) ;

        let time = globalUniform.time ;

        let gBuffer = getGBuffer(vec2i(fragCoord));
        let b = textureSampleLevel( inputBTexture, inputBTextureSampler, inputUV , 0.0 );

        let albedoColor = getAbldeoFromGBuffer(gBuffer) / PI ;
        let bufferColor = getRGBMColorFromGBuffer(gBuffer)  ;
        var colorA = bufferColor.xyz * updateBuffer.colorIns ;
        var color = b.xyz * updateBuffer.indirectIns * albedoColor ;


        // color = LinearToGammaSpace(color);
        // var currentPixel:vec4f = vec4f((colorA.xyz + color.xyz ) , 1.0) ;
        var currentPixel:vec4f = vec4f(colorA.xyz + color , 1.0) ;
        // var currentPixel:vec4f = vec4f(bufferColor , 1.0) ;
        // var currentPixel:vec4f = vec4f(1.0,0.0,0.0, 1.0) ;
        textureStore(outTexture, fragCoord , currentPixel );
    }

  

`