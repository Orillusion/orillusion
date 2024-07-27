/**
 * @internal
 */
export let TestComputeLoadBuffer = /* wgsl */`
    #include "GlobalUniform"
    #include "MathShader"
    #include "FastMathShader"
    #include "BitUtil"
    #include "ColorUtil_frag"
    #include "GBufferStand"

    struct Uniform{
        state:i32,
        state1:i32,
        state2:i32,
        state3:i32,
    }

    @group(0) @binding(auto) var outputTexture : texture_storage_2d<rgba16float, write>;
    @group(0) @binding(auto) var reflectionsGBufferTexture : texture_2d<f32>;
    @group(0) @binding(auto) var currentRenderTexture : texture_2d<f32>;
    @group(0) @binding(auto) var envMap : texture_2d<f32>;
    @group(0) @binding(auto) var<uniform> uniformData : Uniform;
    
    var<private> fragCoord:vec2<u32>;
    var<private> screenSize:vec2<u32>;
    var<private> fragColor:vec4f;
    const PI = 3.1415926 ;
    
    var<private> colorSet : array<vec3<f32>, 9> = array<vec3<f32>, 9>(
        vec3<f32>(1.0, 0.0, 0.0),
        vec3<f32>(1.0, 0.5, 0.0),
        vec3<f32>(0.5, 1.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.0),
        vec3<f32>(0.0, 1.0, 0.5),
        vec3<f32>(0.0, 0.5, 1.0),
        vec3<f32>(0.0, 0.0, 1.0),
        vec3<f32>(0.5, 0.0, 1.0),
        vec3<f32>(1.0, 0.0, 0.5)
    );

    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        
        fragCoord = globalInvocation_id.xy;
        screenSize = vec2u(textureDimensions(outputTexture));

        useNormalMatrixInv();

        let color = textureLoad(currentRenderTexture, fragCoord , 0);
        fragColor = color ;

        var outPixel:vec3f ;
        var a = globalUniform.time ;

        var state = uniformData.state ;
        //render normal color
        let gBuffer : GBuffer = getGBuffer( vec2i(fragCoord) );
        switch (state) {
            case 0:{
                break;
            }
            case 1:{
                fragColor = vec4f(getAbldeoFromGBuffer(gBuffer).rgb,1.0) ;
                break;
            }
            case 2:{
                fragColor = vec4f(getViewNormalFromGBuffer(gBuffer),1.0) ;
                break;
            }
            case 3:{
                fragColor = vec4f(getWorldNormalFromGBuffer(gBuffer),1.0) ;
                break;
            }
            case 4:{
                fragColor = vec4f(vec3f(getRoughnessFromGBuffer(gBuffer)),1.0) ;
                break;
            }
            case 5:{
                fragColor = vec4f(vec3f(getMetaillicFromGBuffer(gBuffer)),1.0) ;
                break;
            }    
            case 6:{
                fragColor = vec4f(vec3f(getAlphaFromGBuffer(gBuffer)),1.0) ;
                break;
            }
            case 7:{
                let id = (f32(getIDFromGBuffer_i32(gBuffer)) * f_r22g8.r) % 9.0;
                fragColor = vec4f(colorSet[u32(id)],1.0) ;
                break;
            }
            
            default:{
                break;
            }
        }

        let size = f32(uniformData.state1) ; 
        let renderRec1 = vec4f(0.0,0.0,size,size);
        renderBufferToViewPort(reflectionsGBufferTexture,renderRec1);

        let size2 = f32(uniformData.state2) ; 
        let renderRec2 = vec4f(0.0,size,size2,size2);
        renderColorBufferToViewPort(envMap,renderRec2);
      
        //not chage final color out put 
        textureStore(outputTexture, fragCoord , fragColor );
    }

    fn renderBufferToViewPort( texture:texture_2d<f32> , viewRectangle:vec4f) {
        let size = vec2f(textureDimensions(texture));
        let f32FragCoord = vec2f(fragCoord);
        if(insideRectangle(f32FragCoord,viewRectangle)){
            let uv = clipViewUV(viewRectangle,size,f32FragCoord);
            let gBuffer = textureGBuffer(texture,uv);
            let color = getRGBMColorFromGBuffer(gBuffer);
            fragColor = vec4f(color,1.0); 
        }
    }

    fn renderColorBufferToViewPort( texture:texture_2d<f32> , viewRectangle:vec4f) {
        let size = vec2f(textureDimensions(texture));
        let f32FragCoord = vec2f(fragCoord);
        if(insideRectangle(f32FragCoord,viewRectangle)){
            let uv = clipViewUV(viewRectangle,size,f32FragCoord);
            let color = textureLoad(texture, uv , 0).rgb;
            fragColor = vec4f(color,1.0); 
        }
    }

    fn textureGBuffer( texture:texture_2d<f32> , fragCoord:vec2u ) -> GBuffer {
        let bufferTex = textureLoad(texture, fragCoord , 0) ;
        var gBuffer:GBuffer ;
        gBuffer.x = bufferTex.x ;
        gBuffer.y = bufferTex.y ;
        gBuffer.z = bufferTex.z ;
        gBuffer.w = bufferTex.w ;
        return gBuffer ;
    }

 
`