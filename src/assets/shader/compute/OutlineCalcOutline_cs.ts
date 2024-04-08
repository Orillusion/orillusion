
export let OutlineCalcOutline_cs: string = /*wgsl*/ `
#include "GlobalUniform"
#include "GBufferStand"

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

  struct OutlineSlotData{
    color: vec3<f32>,
    count: f32,
  }

  struct OutlineWeightData{
    slotIndex:f32,
    outerSlotIndex:f32,
    entityIndex:f32,
    weight:f32
  }

  struct OutlineEntities{
    list: array<f32, 16u>,
  }

  @group(0) @binding(2) var<uniform> outlineSetting: OutlineSettingData;
  @group(0) @binding(3) var<storage, read_write> slotsBuffer : array<OutlineSlotData>;
  @group(0) @binding(4) var<storage, read_write> weightBuffer : array<OutlineWeightData>;
  @group(0) @binding(5) var<storage, read_write> entitiesBuffer : array<OutlineEntities>;

  var<private> texSize: vec2<u32>;
  var<private> lowSize: vec2<i32>;
  var<private> fragCoord: vec2<i32>;
  var<private> fragUV: vec2<f32>;
  var<private> fragCoordLow: vec2<i32>;
  var<private> coordIndex: i32;

  var<private> fragOutline: OutlineWeightData;
  const PI = 3.1415926 ;

  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    useNormalMatrixInv();
    fragCoordLow = vec2<i32>( globalInvocation_id.xy );
    texSize = textureDimensions(gBufferTexture).xy;
    fragUV = vec2<f32>(fragCoordLow) / vec2<f32>(texSize);

    lowSize = vec2<i32>(i32(outlineSetting.lowTexWidth), i32(outlineSetting.lowTexHeight));
    let scaleValue = f32(texSize.x) / f32(lowSize.x);
    fragCoord.x = i32(f32(fragCoordLow.x) * scaleValue);
    fragCoord.y = i32(f32(fragCoordLow.y) * scaleValue);

    if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
        return;
    }
    if(fragCoordLow.x >= lowSize.x || fragCoordLow.y >= lowSize.y){
        return;
    }
    
    coordIndex = fragCoordLow.x + fragCoordLow.y * lowSize.x;
    fragOutline = weightBuffer[coordIndex];

    var gBuffer = getGBuffer( fragCoord ) ;
    fragOutline.entityIndex = f32(getIDFromGBuffer_i32(gBuffer));
    fragOutline.slotIndex = -1.0;
    fragOutline.outerSlotIndex = -1.0;
    fragOutline.weight = 0.0;
    
    if(fragOutline.entityIndex >= 0.0){
      fragOutline.slotIndex = f32(matchOutlineSlot());
    }
    weightBuffer[coordIndex] = fragOutline;
  }

  fn matchOutlineSlot() -> i32
  {
    for(var i:i32 = 0; i < 8; i ++){
        var slotData:OutlineSlotData = slotsBuffer[i];
        var entities:array<f32, 16u> = entitiesBuffer[i].list;
        let count:i32 = i32(slotData.count);
        for(var j:i32 = 0; j < count; j ++){
            var outlineIndex = entities[j];
            if(abs(fragOutline.entityIndex - outlineIndex) < 0.1){ 
                return i;
            }
        }
    }
    return -1;
  }
`
