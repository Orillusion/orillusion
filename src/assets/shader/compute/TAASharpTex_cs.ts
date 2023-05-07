export let TAASharpTex_cs: string = /*wgsl*/ `
    struct TAAData{
      preProjMatrix: mat4x4<f32>,
      preViewMatrix: mat4x4<f32>,
      jitterFrameIndex: f32,
      blendFactor: f32,
      sharpFactor: f32,
      sharpPreBlurFactor: f32,
      jitterX: f32,
      jitterY: f32,
      slot0: f32,
      slot1: f32,
    }
    @group(0) @binding(0) var<uniform> taaData: TAAData;
    @group(0) @binding(1) var inTex : texture_2d<f32>;
    @group(0) @binding(2) var outTex : texture_storage_2d<rgba16float, write>;

    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;

    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(outTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
          return;
      }
      
      let c0 = textureLoad(inTex, vec2<i32>(fragCoord.x, fragCoord.y - 1), 0);
      let c1 = textureLoad(inTex, vec2<i32>(fragCoord.x, fragCoord.y + 1), 0);
      let c2 = textureLoad(inTex, vec2<i32>(fragCoord.x - 1, fragCoord.y), 0);
      let c3 = textureLoad(inTex, vec2<i32>(fragCoord.x + 1, fragCoord.y), 0);
      
      var roundColor = (c0 + c1 + c2 + c3) * 0.25;
      let originColor = textureLoad(inTex, fragCoord, 0);
      let blurColor = mix(roundColor, originColor, taaData.sharpPreBlurFactor);
      var oc = (originColor - blurColor * taaData.sharpFactor) / (1.0 - taaData.sharpFactor);
      oc = clamp(oc, vec4<f32>(0.0), oc);
      textureStore(outTex, fragCoord , oc);
    }
`
