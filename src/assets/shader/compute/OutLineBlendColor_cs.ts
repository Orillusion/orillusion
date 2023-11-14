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


   fn CalcUV_01(coord:vec2<i32>, texSize:vec2<u32>) -> vec2<f32>
   {
      let u = (f32(coord.x) + 0.5) / f32(texSize.x);
      let v = (f32(coord.y) + 0.5) / f32(texSize.y);
      return vec2<f32>(u, v);
   }

   @compute @workgroup_size( 8 , 8 , 1 )
   fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
   {
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(outlineTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
         return;
      }

      let uv01 = CalcUV_01(fragCoord, texSize);
      var outLineColor = textureSampleLevel(lowTex, lowTexSampler, uv01, 0.0);

      outLineColor.x *= outlineSetting.strength;
      outLineColor.y *= outlineSetting.strength;
      outLineColor.z *= outlineSetting.strength;

      var inColor = textureLoad(inTex, fragCoord, 0);
      var blendColor:vec3<f32> = vec3<f32>(0.0);
      if(outlineSetting.useAddMode > 0.5){
         blendColor = inColor.xyz + outLineColor.xyz * outLineColor.w;
      }else{
         blendColor = mix(inColor.xyz, outLineColor.xyz, outLineColor.w);
      }
      textureStore(outlineTex, fragCoord, vec4<f32>(blendColor, inColor.w));
   }

`
