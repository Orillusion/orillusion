/**
 * @internal
 */
export let GTAO_cs: string = /*wgsl*/ `
    #include "GlobalUniform"
    #include "GBufferStand"
    
    struct GTAO{
      maxDistance: f32,
      maxPixel: f32,
      darkFactor: f32,
      rayMarchSegment: f32,
      cameraNear: f32,
      cameraFar: f32,
      multiBounce: f32,
      blendColor: f32,
    }

    @group(0) @binding(2) var<uniform> gtaoData: GTAO;
    @group(0) @binding(3) var<storage, read_write> directions : array<vec2<f32>>;
    @group(0) @binding(4) var<storage, read_write> aoBuffer : array<f32>;
 
    @group(0) @binding(5) var inTex : texture_2d<f32>;
    @group(0) @binding(6) var outTex : texture_storage_2d<rgba16float, write>;
    
    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> fragUV: vec2<f32>;
    var<private> wPosition: vec3<f32>;
    var<private> wNormal: vec4<f32>;
    var<private> maxPixelScaled: f32;

    var<private> gBuffer: GBuffer;

    const PI = 3.1415926 ;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
      
      fragCoord = vec2<i32>( globalInvocation_id.xy );
      texSize = textureDimensions(inTex).xy;
      if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
        return;
      }
      
      fragUV = vec2<f32>(fragCoord) / vec2<f32>(texSize - 1);
      useNormalMatrixInv();

      gBuffer = getGBuffer( fragCoord ) ;
      wNormal = vec4f(getWorldNormalFromGBuffer(gBuffer),1.0); 
      var visible = getRoughnessFromGBuffer(gBuffer);

      var oc = textureLoad(inTex, fragCoord, 0);
      let index = fragCoord.x + fragCoord.y * i32(texSize.x);
      let lastFactor = aoBuffer[index];
      var newFactor = 0.0;
      if(visible > 0.0){//sky
          wPosition = getWorldPositionFromGBuffer(gBuffer,fragUV);
          let ndc = globalUniform.projMat * globalUniform.viewMat * vec4<f32>(wPosition, 1.0);
          let ndcZ = ndc.z / ndc.w;
          maxPixelScaled = calcPixelByNDC(ndcZ);
          newFactor = rayMarch();
      }
      
      var factor:f32 = mix(lastFactor, newFactor, 0.6);
      aoBuffer[index] = factor;
      factor = blurFactor(factor);
      factor = saturate(1.0 - factor * gtaoData.darkFactor);
      var gtao = vec3<f32>(factor);
      if(gtaoData.multiBounce > 0.5){
          gtao = MultiBounce(factor, oc.xyz);
      }
      
      var outColor = gtao;
      if(gtaoData.blendColor > 0.5){
          outColor = oc.xyz * gtao;
      }
      // textureStore(outTex, fragCoord , vec4<f32>(vec3f(newFactor), oc.w));
      textureStore(outTex, fragCoord , vec4<f32>(outColor, oc.w));
    }
    
    fn MultiBounce(AO:f32, Albedo:vec3<f32>) -> vec3<f32>
    {
        var A = 2 * Albedo - 0.33;
        var B = -4.8 * Albedo + 0.64;
        var C = 2.75 * Albedo + 0.69;
        return max(vec3<f32>(AO), ((AO * A + B) * AO + C) * AO);
    }
    
    fn calcPixelByNDC(ndcZ:f32) -> f32{
      let nearAspect = gtaoData.cameraNear / (gtaoData.cameraFar - gtaoData.cameraNear);
      let aspect = (1.0 + nearAspect) / (ndcZ + nearAspect);
      var viewPortMax = min(f32(texSize.x), f32(texSize.y));
      var maxPixel = min(viewPortMax, gtaoData.maxPixel * aspect);
      maxPixel = max(0.1, maxPixel);
      return maxPixel;
    }
    
    fn blurFactor(centerFactor:f32) -> f32{
      var coord0 = clamp(fragCoord + vec2<i32>(1, 0) , vec2<i32>(0), vec2<i32>(texSize - 1));
      var coord1 = clamp(fragCoord + vec2<i32>(-1, 0), vec2<i32>(0), vec2<i32>(texSize - 1));
      var coord2 = clamp(fragCoord + vec2<i32>(0, 1) , vec2<i32>(0), vec2<i32>(texSize - 1));
      var coord3 = clamp(fragCoord + vec2<i32>(0, -1), vec2<i32>(0), vec2<i32>(texSize - 1));
      var index0 = coord0.x + coord0.y * i32(texSize.x);
      var index1 = coord1.x + coord1.y * i32(texSize.x);
      var index2 = coord2.x + coord2.y * i32(texSize.x);
      var index3 = coord3.x + coord3.y * i32(texSize.x);
      let factor0:f32 = aoBuffer[index0];
      let factor1:f32 = aoBuffer[index1];
      let factor2:f32 = aoBuffer[index2];
      let factor3:f32 = aoBuffer[index3];
      var factor = 0.25 * (factor0 + factor1 + factor2 + factor3);
      factor = mix(factor, centerFactor, 0.8);
      return factor;
    }
    
    fn rayMarch() -> f32{
      let originNormal = normalize(vec3<f32>(wNormal.xyz));
      let stepPixel = maxPixelScaled / gtaoData.rayMarchSegment;
      var weight:f32 = 0.0;
      var totalWeight:f32 = 0.00001;
      for(var i:i32 = 0; i < 8; i += 1){
          let dirVec2 = directions[i];
          for(var j:f32 = 1.1; j < maxPixelScaled; j += stepPixel){
              var sampleCoord = vec2<i32>(dirVec2 * j) + fragCoord;
              if(sampleCoord.x >= 0 && sampleCoord.y >= 0 
                && sampleCoord.x < i32(texSize.x) 
                && sampleCoord.y < i32(texSize.y) )
              {
                totalWeight += 1.0;

                let subGBuffer = getGBuffer( sampleCoord ) ;
                let samplePosition = getWorldPositionFromGBuffer(subGBuffer,vec2f(sampleCoord)/vec2f(texSize));
                var visible = getRoughnessFromGBuffer(subGBuffer);
                if(visible>0.0){
                  let distanceVec2 = samplePosition.xyz - wPosition;
                  let distance = length(distanceVec2);
                  if(distance < gtaoData.maxDistance ){
                    let sampleDir = normalize(distanceVec2);
                    var factor = saturate( dot(sampleDir, originNormal));
                    factor *= 1.0 - distance / gtaoData.maxDistance;
                    weight += factor;
                  }
                }
              }
          }
      }
      weight /= totalWeight;
      return weight;
    }
  `