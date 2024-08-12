/**
 * @internal
 */
export let Denoising_cs = /* wgsl */`
    // #include "GlobalUniform"

    struct FrameBuffer{
        frameCount : f32 ,
        indirectIns : f32 ,
        delay : f32 ,
        frameCount4 : i32 ,
    }
    
    @group(0) @binding(1) var<storage,read_write> updateBuffer: FrameBuffer ;
    @group(0) @binding(2) var newTexture : texture_2d<f32>;
    @group(0) @binding(3) var oldTexture : texture_2d<f32>;
    @group(0) @binding(4) var combineTexture : texture_storage_2d<rgba16float, write>;
    var<private> fragCoord:vec2<u32>;
    
    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        fragCoord = globalInvocation_id.xy;

        // if(updateBuffer.frameCount < 256){
            let newPixel = textureLoad( newTexture, fragCoord, 0 );
            let oldPixel = textureLoad( oldTexture, fragCoord, 0 );
    
            let weight = updateBuffer.delay ;
            var currentPixel:vec4f;
            currentPixel = vec4f(newPixel.xyz * weight + (1.0-weight) * oldPixel.xyz , 1.0 );
            textureStore(combineTexture, fragCoord , currentPixel );
    }

  

`