export let TAACopyTex_cs: string = /*wgsl*/ `
    @group(0) @binding(0) var<storage, read_write> preColor : array<vec4<f32>>;
    @group(0) @binding(1) var preColorTex : texture_storage_2d<rgba16float, write>;

    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> coordIndex: i32;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(preColorTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      coordIndex = fragCoord.x + fragCoord.y * i32(texSize.x);
      textureStore(preColorTex, fragCoord , preColor[coordIndex]);
    }
 `

