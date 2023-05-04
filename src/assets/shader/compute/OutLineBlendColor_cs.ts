export let OutLineBlendColor_cs: string = /*wgsl*/ `
   struct OutlineSettingData{
      strength: f32,
      useAddMode: f32,
      outlinePixel: f32,
      fadeOutlinePixel: f32,
      lowTexWidth: f32,
      lowTexHeight: f32,
      slot0: f32,
      slot1: f32,
   }

   @group(0) @binding(0) var<uniform> outlineSetting: OutlineSettingData;
   @group(0) @binding(1) var inTex : texture_2d<f32>;
   @group(0) @binding(2) var lowTexSampler : sampler;
   @group(0) @binding(3) var lowTex : texture_2d<f32>;
   @group(0) @binding(4) var outlineTex : texture_storage_2d<rgba16float, write>;
   
   var<private> texSize: vec2<u32>;
   var<private> fragCoord: vec2<i32>;

   @compute @workgroup_size( 8 , 8 , 1 )
   fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
   {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(outlineTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
         return;
      }

      let uv01 = vec2<f32>(fragCoord) / (vec2<f32>(texSize) - 1.0);
      let outLineColor = textureSampleLevel(lowTex, lowTexSampler, uv01, 0.0) * outlineSetting.strength;
      var newOC = textureLoad(inTex, fragCoord, 0);
      var blendColor:vec3<f32> = vec3<f32>(0.0);
      if(outlineSetting.useAddMode > 0.5){
         blendColor = vec3<f32>(newOC.xyz) + vec3<f32>(outLineColor.xyz) * outLineColor.w;
      }else{
         blendColor = mix(vec3<f32>(newOC.xyz), vec3<f32>(outLineColor.xyz), outLineColor.w);
      }
      textureStore(outlineTex, fragCoord , vec4<f32>(blendColor, newOC.w));
   }
`
