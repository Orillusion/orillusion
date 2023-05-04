export let MergeRGBA_cs: string = /*wgsl*/ `
    @group(0) @binding(0) var textureR : texture_2d<f32>;
    @group(0) @binding(1) var textureG : texture_2d<f32>;
    @group(0) @binding(2) var textureB : texture_2d<f32>;
    @group(0) @binding(3) var textureA : texture_2d<f32>;
    @group(0) @binding(4) var outTex : texture_storage_2d<rgba8unorm, write>;

    @compute @workgroup_size(8, 8, 1)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        let size = textureDimensions(outTex);
        let fragCoord : vec2<i32> = vec2<i32>(GlobalInvocationID.xy); 
        var uv:vec2<f32>;
        uv.x = f32(fragCoord.x)/f32(size.x);
        uv.y = f32(fragCoord.y)/f32(size.y);
        var oc:vec4<f32> = textureSampleLevel(atlasTexture, atlasTextureSampler, targetUV, 0.0);

        let sizeR = textureDimensions(textureR);
        let sizeG = textureDimensions(textureG);
        let sizeB = textureDimensions(textureB);
        let sizeA = textureDimensions(textureA);
        
        var tr = textureLoad(textureR, vec2<i32>(uv * sizeR) , 0 ) ;
        var tg = textureLoad(textureG, vec2<i32>(uv * sizeG) , 0 ) ;
        var tb = textureLoad(textureB, vec2<i32>(uv * sizeB) , 0 ) ;
        var ta = textureLoad(textureA, vec2<i32>(uv * sizeA) , 0 ) ;

        let color = vec4<f32>(tr,tg,tb,ta);
        textureStore(outTex, fragCoord , vec4(color));
    }

`
