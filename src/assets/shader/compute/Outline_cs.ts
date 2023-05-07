export let Outline_cs: string = /*wgsl*/ `
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

    @group(0) @binding(0) var<uniform> outlineSetting: OutlineSettingData;
    @group(0) @binding(1) var<storage, read_write> slotsBuffer : array<OutlineSlotData>;
    @group(0) @binding(2) var<storage, read_write> weightBuffer : array<OutlineWeightData>;
    @group(0) @binding(3) var<storage, read_write> oldOutlineColor : array<vec4<f32>>;
    @group(0) @binding(4) var lowTex : texture_storage_2d<rgba16float, write>;
    
    var<private> texSize: vec2<u32>;
    var<private> fragCoord: vec2<i32>;
    var<private> coordIndex: i32;
    var<private> fragOutline: OutlineWeightData;
    
    @compute @workgroup_size( 8 , 8 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        fragCoord = vec2<i32>( globalInvocation_id.xy );
        texSize = textureDimensions(lowTex).xy;
        if(fragCoord.x >= i32(texSize.x) || fragCoord.y >= i32(texSize.y)){
            return;
        }
        
        coordIndex = fragCoord.x + fragCoord.y * i32(texSize.x);
        fragOutline = weightBuffer[coordIndex];
        
        var blendColor = vec3<f32>(0.0);
        var newOC = vec4<f32>(0.0);
        
        calcOutline();
        let outerSlotIndex:i32 = i32(round(fragOutline.outerSlotIndex));
        if(outerSlotIndex >= 0){
            let outLineColor = slotsBuffer[outerSlotIndex].color;
            newOC = vec4<f32>(outLineColor, fragOutline.weight);
        }
        
        let coordIndex0 = fragCoord.x + 1 + (fragCoord.y - 1) * i32(texSize.x);
        let coordIndex1 = fragCoord.x - 1 + (fragCoord.y - 1) * i32(texSize.x);
        let coordIndex2 = fragCoord.x + (fragCoord.y + 1) * i32(texSize.x);

        let oldOC = oldOutlineColor[coordIndex];
        let oldOC0 = oldOutlineColor[coordIndex0];
        let oldOC1 = oldOutlineColor[coordIndex1];
        let oldOC2 = oldOutlineColor[coordIndex2];
        
        newOC = mix((oldOC + oldOC0 + oldOC1 + oldOC2) * 0.25, newOC, 0.4);
        
        oldOutlineColor[coordIndex] = newOC;
        textureStore(lowTex, fragCoord, newOC);
    }
    
    fn calcOutline()
    {
        let outlinePixel = outlineSetting.outlinePixel;
        let fadeOutlinePixel = outlineSetting.fadeOutlinePixel;
        let pixelRadius = outlinePixel + fadeOutlinePixel;
        let minX = max(0.0, f32(fragCoord.x) - pixelRadius);
        let maxX = min(f32(texSize.x), f32(fragCoord.x) + pixelRadius);
        let minY = max(0.0, f32(fragCoord.y) - pixelRadius);
        let maxY = min(f32(texSize.y), f32(fragCoord.y) + pixelRadius);
        var coordTemp_f32 = vec2<f32>(0.0);
        var coordCurrent_f32 = vec2<f32>(fragCoord);
        var tempCoordIndex = 0;
        var tempWeightData: OutlineWeightData;
        for(var x:f32 = minX; x < maxX; x += 1.0){
            for(var y:f32 = minY; y < maxY; y += 1.0){
                coordTemp_f32.x = x;
                coordTemp_f32.y = y;
                let distanceToOuter = length(coordTemp_f32 - coordCurrent_f32);
                if(distanceToOuter < pixelRadius){
                    var coord_i32 = vec2<i32>(coordTemp_f32);
                    tempCoordIndex = coord_i32.x + coord_i32.y * i32(texSize.x);
                    tempWeightData = weightBuffer[tempCoordIndex];
                    let outlineGap = abs(tempWeightData.slotIndex - fragOutline.slotIndex);
                    if(outlineGap > 0.1){
                        if(tempWeightData.slotIndex > fragOutline.slotIndex){
                            if(abs(tempWeightData.slotIndex - fragOutline.outerSlotIndex) < 0.1){
                                fragOutline.weight = max(fragOutline.weight, calcWeight(pixelRadius, distanceToOuter, outlinePixel));
                                fragOutline.outerSlotIndex = tempWeightData.slotIndex;
                                weightBuffer[tempCoordIndex] = tempWeightData;
                            }else if(tempWeightData.slotIndex > fragOutline.outerSlotIndex){
                                fragOutline.weight = calcWeight(pixelRadius, distanceToOuter, outlinePixel);
                                fragOutline.outerSlotIndex = tempWeightData.slotIndex;
                                weightBuffer[tempCoordIndex] = tempWeightData;
                            }
                        }
                    }
                }
            }
        }
    }
    
    fn calcWeight(radius:f32, distance0:f32, outlinePixel:f32) -> f32{
        let distance = distance0 - outlinePixel;
        if(distance < 0.0){
            return 1.0;
        }
        var ret = 1.0 - distance / (radius - outlinePixel);
        return ret;
    }
`

