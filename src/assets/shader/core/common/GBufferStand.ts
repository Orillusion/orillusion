/**
 * @internal
 */
export let GBufferStand = /* wgsl */ `
    #include "MathShader"
    #include "FastMathShader"
    #include "BitUtil"
    #include "ColorUtil_frag"

    @group(0) @binding(1) var gBufferTexture : texture_2d<f32>;

    struct GBuffer{
        x : f32 ,
        y : f32 ,
        z : f32 ,
        w : f32 ,
    }

    struct ViewSpaceGBuffer{
        depth:f32,
        color:vec3f ,
        abldeoColor:vec3f ,
        viewPosition:vec3f,
        viewNormal:vec3f,
        roughness:f32,
        metallic:f32,
    }

    struct WorldSpaceGBuffer{
        depth:f32,
        color:vec3f ,
        abldeoColor:vec3f ,
        worldPosition:vec3f,
        worldNormal:vec3f,
        roughness:f32,
        metallic:f32,
    }

    fn getViewSpaceGBuffer(fragCoord:vec2i , uv:vec2f ) -> ViewSpaceGBuffer {
        var sampleUV = uv ;
        sampleUV.y = 1.0 - sampleUV.y ;
        let gBufferTexture = textureLoad(gBufferTexture, fragCoord , 0) ;

        var gBuffer : ViewSpaceGBuffer ;
        //x channel view space depth 
        gBuffer.depth = gBufferTexture.x ;
        let viewPos = getViewPosition(gBufferTexture.x,sampleUV);
        gBuffer.viewPosition = viewPos;
        
        //y channel last final color texture
        gBuffer.color = floatToVec3f(gBufferTexture.y) ;

        //z channel view space normal 
        let zChannel = floatToVec3f(gBufferTexture.z) ;
        let octUV = zChannel.xy * 2.0 - 1.0  ;
        gBuffer.viewNormal = octDecode(octUV.xy) ;

        //w channel view space normal 
        let wChannel = floatToVec3f(gBufferTexture.w) ;
        gBuffer.abldeoColor = wChannel.xyz ;

        gBuffer.roughness = zChannel.z ;
        gBuffer.metallic = 0.0 ;//wChannel.w ;

        return gBuffer ;
    }

    fn getWorldSpaceGBuffer(fragCoord:vec2i , uv:vec2f ) -> WorldSpaceGBuffer {
        var sampleUV = uv ;
        sampleUV.y = 1.0 - sampleUV.y ;
        let gBufferTexture = textureLoad(gBufferTexture, fragCoord , 0) ;

        var gBuffer : WorldSpaceGBuffer ;
        //x channel view space depth 
        gBuffer.depth = gBufferTexture.x ;
        let worldPos = getWorldPosition(gBufferTexture.x,sampleUV);
        gBuffer.worldPosition = worldPos;

        //y channel last final color texture
        gBuffer.color = floatToVec3f(gBufferTexture.y) ;

        //z channel world space normal and roughness 
        let zChannel = floatToVec3f(gBufferTexture.z) ;
        let octUV = zChannel.xy * 2.0 - 1.0  ;
        gBuffer.worldNormal = getWorldNormal(octDecode(octUV.xy)) ;

        //w channel abldeoColor and metallic
        let wChannel = floatToVec3f(gBufferTexture.w) ;
        gBuffer.abldeoColor = wChannel.xyz ;

        gBuffer.roughness = zChannel.z ;
        gBuffer.metallic = 0.0 ;//wChannel.w ;

        return gBuffer ;
    }

    fn getGBuffer(fragCoord:vec2i) -> GBuffer {
        let gBufferTexture = textureLoad(gBufferTexture, fragCoord , 0) ;
        var gBuffer:GBuffer ;
        gBuffer.x = gBufferTexture.x ;
        gBuffer.y = gBufferTexture.y ;
        gBuffer.z = gBufferTexture.z ;
        gBuffer.w = gBufferTexture.w ;
        return gBuffer ;
    }

    fn getDepthFromGBuffer(gBuffer:GBuffer) -> f32 {
        return gBuffer.x ;
    }

    fn getViewPositionFromGBuffer(gBuffer:GBuffer,screenUV:vec2f) -> vec3f {
        var sampleUV = screenUV ;
        sampleUV.x = 1.0 - sampleUV.x ;
        sampleUV.y = 1.0 - sampleUV.y ;
        let viewPos = getViewPosition(gBuffer.x,sampleUV);
        return viewPos;
    }

    fn getViewNormalFromGBuffer(gBuffer:GBuffer) -> vec3f {
        let worldNormal = getWorldNormalFromGBuffer(gBuffer) ;
        return getViewNormal(worldNormal);
    }

    fn getWorldPositionFromGBuffer(gBuffer:GBuffer,uv:vec2f) -> vec3f {
        var sampleUV = uv ;
        sampleUV.y = 1.0 - sampleUV.y ;
        let worldPos = getWorldPosition(gBuffer.x,sampleUV);
        return worldPos;
    }

    fn getSkyPositionFromGBuffer(uv:vec2f) -> vec3f {
        var sampleUV = uv ;
        sampleUV.y = 1.0 - sampleUV.y ;
        let worldPos = getWorldPosition(0.9999999, sampleUV);
        return worldPos;
    }

    fn getRGBMColorFromGBuffer(gBuffer:GBuffer) -> vec3f {
        let rgb = unpack4x8unorm(u32(gBuffer.z)).rgb ;
        let m = unpack4x8unorm(u32(gBuffer.w)).z ;
        return DecodeRGBM(vec4f(rgb,m)) ;
    }

   
    fn getWorldNormalFromGBuffer(gBuffer:GBuffer) -> vec3f {
        // let viewNormal = getViewNormalFromGBuffer(gBuffer) ; 
        // let worldNormal = getWorldNormal(viewNormal) ;
        // return worldNormal;
        let zChannel = float_to_r11g11b9(gBuffer.y) ;
        let octUV = zChannel.xy * 2.0 - 1.0  ;
        let viewNormal = octDecode(octUV.xy);
        return viewNormal;
    }



    fn getAbldeoFromGBuffer(gBuffer:GBuffer) -> vec4f {
        let rgba = floatToVec4f_7bits(gBuffer.z).rgba ;
        return rgba ;
    }

    fn getAlphaFromGBuffer(gBuffer:GBuffer) -> f32 {
        let rgba = floatToVec4f_7bits(gBuffer.z).rgba ;
        return rgba.a;
    }

    fn getMetaillicFromGBuffer(gBuffer:GBuffer) -> f32 {
        let channel = float_to_r22g8(gBuffer.w) ;
        return channel.y;
    }

    fn getRoughnessFromGBuffer(gBuffer:GBuffer) -> f32 {
        let channel = float_to_r11g11b9(gBuffer.y) ;
        return channel.z;
    }

    fn getIDFromGBuffer_f32_01(gBuffer:GBuffer) -> f32 {
        let channel = float_to_r22g8(gBuffer.w) ;
        return channel.x;
    }

    fn getIDFromGBuffer_i32(gBuffer:GBuffer) -> i32 {
        let id_f32_01 = getIDFromGBuffer_f32_01(gBuffer) ;
        let id = i32(round(id_f32_01 * f_r22g8.r));
        return id;
    }

    
`