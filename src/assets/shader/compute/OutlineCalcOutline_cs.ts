
export let OutlineCalcOutline_cs: string = /*wgsl*/ `
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

  @group(0) @binding(0) var<uniform> outlineSetting: OutlineSettingData;
  @group(0) @binding(1) var<storage, read_write> slotsBuffer : array<OutlineSlotData>;
  @group(0) @binding(2) var<storage, read_write> weightBuffer : array<OutlineWeightData>;
  @group(0) @binding(3) var<storage, read_write> entitiesBuffer : array<OutlineEntities>;
  @group(0) @binding(4) var indexTexture : texture_2d<f32>;

  var<private> texSize: vec2<u32>;
  var<private> lowSize: vec2<i32>;
  var<private> fragCoord: vec2<i32>;
  var<private> fragCoordLow: vec2<i32>;
  var<private> coordIndex: i32;

  var<private> fragOutline: OutlineWeightData;

  @compute @workgroup_size( 8 , 8 , 1 )
  fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
  {
    fragCoordLow = vec2<i32>( globalInvocation_id.xy );
    fragCoord = fragCoordLow * 2;
    texSize = textureDimensions(indexTexture).xy;
    lowSize = vec2<i32>(i32(outlineSetting.lowTexWidth), i32(outlineSetting.lowTexHeight));

    if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
        return;
    }
    if(fragCoordLow.x >= lowSize.x || fragCoordLow.y >= lowSize.y){
        return;
    }
    
    coordIndex = fragCoordLow.x + fragCoordLow.y * lowSize.x;
    fragOutline = weightBuffer[coordIndex];
    var wPos = textureLoad(indexTexture, fragCoord, 0 ) ;
    
    fragOutline.entityIndex = round(wPos.w);
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
