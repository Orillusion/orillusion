export let Irradiance_frag: string = /*wgsl*/ `
#include "IrradianceVolumeData_frag"
    fn pow3(  x : f32 ) -> f32
    {
        var xx = x*x;
        return x * xx;
    }

    struct IrradianceField {
        probeStartPosition: vec4<f32>,
        probeCounts:vec4<f32>,
        probeStep:f32,
        irradianceTextureWidth:f32,
        irradianceTextureHeight:f32,
        irradianceProbeSideLength:f32,
    };

    @group(1) @binding(auto)
    var irradianceMapSampler: sampler;
    @group(1) @binding(auto)
    var irradianceMap: texture_2d<f32>;
    @group(1) @binding(auto)
    var irradianceDepthMapSampler: sampler;
    @group(1) @binding(auto)
    var irradianceDepthMap: texture_2d<f32>;

    @group(2) @binding(6)
    var<storage,read> irradianceData : IrradianceVolumeData ;

    var<private> irradianceFieldSurface: IrradianceField;
    var<private> energyPreservation: f32 = 0.85;
    var<private> quaternion:vec4<f32> = vec4<f32>(0.0, -0.7071067811865475, 0.7071067811865475, 0.0);

    fn getIrradianceFieldSurface() -> IrradianceField{
        let data = irradianceData ;
        irradianceFieldSurface.probeStartPosition = vec4<f32>(data.startX, data.startY, data.startZ, 0.0);
        irradianceFieldSurface.probeCounts = vec4<f32>(data.gridXCount, data.gridYCount, data.gridZCount, 0.0);
        irradianceFieldSurface.probeStep = data.ProbeSpace;
        irradianceFieldSurface.irradianceTextureWidth = data.OctRTMaxSize;
        irradianceFieldSurface.irradianceTextureHeight = data.OctRTMaxSize;
        irradianceFieldSurface.irradianceProbeSideLength = data.OctRTSideSize;
        return irradianceFieldSurface;
    }

    fn rotateDir(n:vec3<f32>) -> vec3<f32>{
       return normalize(applyQuaternion(-n, quaternion));
    }

    fn square1f(v:f32) -> f32 {
        return v * v ;
     }

   fn square(v:vec3<f32>) -> vec3<f32>{
      return v*v;
   }

    fn getIrradiance() -> vec4<f32>{
        var irradiance = sampleIrradianceField();
        var outerVolumeFactor:f32 = getOuterVolume(irradianceFieldSurface, ORI_VertexVarying.vWorldPos.xyz);
        irradiance *= outerVolumeFactor;
        return irradiance ;
    }
    
    fn debugProbe(id:i32) -> vec4<f32>{
        getIrradianceFieldSurface();
        var direction = normalize(ORI_VertexVarying.vWorldNormal);
        direction = applyQuaternion(-direction, quaternion);
        var probeTextureUV : vec2<f32> = textureCoordFromDirection(normalize(direction),
            id,
            irradianceFieldSurface.irradianceTextureWidth,
            irradianceFieldSurface.irradianceTextureHeight,
            irradianceFieldSurface.irradianceProbeSideLength);

        var probeIrradiance: vec4<f32> = textureSampleLevel(irradianceMap, irradianceMapSampler, probeTextureUV ,0.0);
        return probeIrradiance;
    }
    
    fn debugProbeDepth(id:i32) -> vec4<f32>{
        getIrradianceFieldSurface();
        var direction = normalize(ORI_VertexVarying.vWorldNormal);
        direction = applyQuaternion(-direction, quaternion);
        var probeTextureUV : vec2<f32> = textureCoordFromDirection(normalize(direction),
            id,
            irradianceFieldSurface.irradianceTextureWidth,
            irradianceFieldSurface.irradianceTextureHeight,
            irradianceFieldSurface.irradianceProbeSideLength);
        
        var probeIrradiance: vec4<f32> = textureSampleLevel(irradianceDepthMap, irradianceDepthMapSampler, probeTextureUV ,0.0);
        probeIrradiance.x = probeIrradiance.x / irradianceData.maxDistance;
        probeIrradiance.y = 0.0;
        probeIrradiance.z = 0.0;
        probeIrradiance.w = 1.0;
        return probeIrradiance;
    }
    
    fn getOuterVolume(L:IrradianceField, position:vec3<f32>) -> f32{
        let halfWidth:vec3<f32> = 0.5 * (L.probeCounts.xyz - 1.0) * L.probeStep;
        let edgeWidth:vec3<f32> = halfWidth + L.probeStep;
        let centerPosition:vec3<f32> = halfWidth + L.probeStartPosition.xyz;
        let clampPos = min(edgeWidth, abs(position - centerPosition));
        
        let factorX = getOuterAxis(clampPos.x, edgeWidth.x, L.probeStep);
        let factorY = getOuterAxis(clampPos.y, edgeWidth.y, L.probeStep);
        let factorZ = getOuterAxis(clampPos.z, edgeWidth.z, L.probeStep);
        return factorX * factorY * factorZ;
    }
    
    fn getOuterAxis(current:f32, edge:f32, space:f32) -> f32{
        return clamp((edge - current) / space, 0.0, 1.0);
    }

    fn getBaseGridCoord(L:IrradianceField, X:vec3<f32>) -> vec3<i32> {
        var offsetIndex = (X - L.probeStartPosition.xyz) / irradianceFieldSurface.probeStep;
        return clamp(vec3<i32>(offsetIndex.xyz), vec3<i32>(0), vec3<i32>(L.probeCounts.xyz) - 1);
    }

    fn gridCoordToProbeIndex(L:IrradianceField, grid:vec3<i32>) -> i32
    {
        return grid.x + i32(L.probeCounts.x) * grid.z + grid.y * i32(L.probeCounts.z * L.probeCounts.x);
    }

    fn gridCoordToPosition(L:IrradianceField, grid:vec3<i32>) -> vec3<f32>
    {
        var pos:vec3<f32> = vec3<f32>(grid.xyz) * L.probeStep + L.probeStartPosition.xyz;
        return pos;
    }

    fn textureCoordFromDirection(dir:vec3<f32>, probeIndex:i32, width:f32, height:f32, sideLength:f32) -> vec2<f32>
    {
        var uv = getWriteOctUVByID(dir, u32(probeIndex), sideLength) ;
        uv.x = uv.x / irradianceFieldSurface.irradianceTextureWidth;
        uv.y = uv.y / irradianceFieldSurface.irradianceTextureHeight;
        return uv ;
    }

    fn getWriteOctUVByID(dir:vec3<f32> , probeID:u32, size: f32) -> vec2<f32>
    {
        var blockCount = u32(irradianceFieldSurface.probeCounts.x * irradianceFieldSurface.probeCounts.z) ;
        var offsetX = (probeID % blockCount) % u32(irradianceFieldSurface.probeCounts.x) ;
        var offsetY = u32(irradianceFieldSurface.probeCounts.z - 1.0) - (probeID % blockCount) / u32(irradianceFieldSurface.probeCounts.x) ;
        var offsetZ = probeID / blockCount ;

        var pixelCoord = (( octEncode(dir) + 1.0 ) * 0.5) * vec2<f32>(size,size) ;

        var blockOffset = vec2<f32>(0.0);
        blockOffset.x = f32(offsetX) * size;
        blockOffset.y = f32(offsetY) * size + f32(offsetZ) * irradianceFieldSurface.probeCounts.z * size;

        let mapHeight = u32(irradianceFieldSurface.irradianceTextureHeight);
        var probeCounts:vec3<f32> = irradianceFieldSurface.probeCounts.xyz;

        var gridOffsetFrom = vec2<i32>(blockOffset) + 1;
        var gridOffsetTo = offsetByCol(gridOffsetFrom, size, mapHeight, probeCounts);

        pixelCoord = pixelCoord + vec2<f32>(gridOffsetTo - 1) + vec2<f32>(vec2<i32>(vec2<f32>(gridOffsetTo) / size) * 2);

        return pixelCoord + 1.0 ;
    }

    fn offsetByCol(pixelCoord0:vec2<i32>, octSideSize:f32, mapHeight:u32, counts:vec3<f32>) -> vec2<i32>
    {
      var pixelCoord = pixelCoord0;
      let blockSize:vec2<i32> = vec2<i32>(i32(octSideSize * counts.x),  i32(octSideSize * counts.z));
      let blockSizeYBorder:i32 = i32((octSideSize + 2.0) * counts.z);
      let blockMaxRowBorder:i32 = i32(mapHeight) / blockSizeYBorder;
      let pixelCountYMax:i32 = blockMaxRowBorder * i32(octSideSize * counts.z);
      let col:i32 = pixelCoord.y / pixelCountYMax;
      pixelCoord.x = col * i32(octSideSize * counts.x) + pixelCoord.x;
      pixelCoord.y = pixelCoord.y % pixelCountYMax;
      return pixelCoord;
    }

    var<private> wpNormal:vec3<f32> ;
    fn sampleIrradianceField() -> vec4<f32>{
        wpNormal = ORI_ShadingInput.Normal.xyz ;
        var wo:vec3<f32> = ORI_CameraWorldDir ;
        var wsN:vec3<f32> = normalize(wpNormal);
        var direction:vec3<f32> = wpNormal;
        var worldPosition: vec3<f32> = ORI_VertexVarying.vWorldPos.xyz;
   
        getIrradianceFieldSurface();

        let surfaceBias = (wsN + 3.0 * wo) * irradianceData.normalBias ;

        var irradiance = vec3<f32>(0.0, 0.0, 0.0);
        var accumulatedWeights = 0.0;
        var biasedWorldPosition = (worldPosition + surfaceBias);

        var baseProbeCoords: vec3<i32> = getBaseGridCoord(irradianceFieldSurface, worldPosition);
        
        var baseProbeWorldPosition: vec3<f32> = gridCoordToPosition(irradianceFieldSurface, baseProbeCoords) ;
        
        var gridSpaceDistance = (biasedWorldPosition - baseProbeWorldPosition);

        // alpha is how far from the floor(currentVertex) position. on [0, 1] for each axis.
        var alpha: vec3<f32> = clamp(gridSpaceDistance / (irradianceFieldSurface.probeStep), vec3<f32>(0.0), vec3<f32>(1.0));
        // let irradianceDir = rotateDir(wsN.xyz);
        // Iterate over adjacent probe cage
        for (var i:i32 = 0; i < 8; i = i + 1) {
            var adjacentProbeOffset : vec3<i32> = vec3<i32>(i, i32(f32(i) * 0.5), i32(f32(i) * 0.25)) & vec3<i32>(1);
            var adjacentProbeCoords: vec3<i32> = clamp(baseProbeCoords + adjacentProbeOffset, vec3<i32>(0),  vec3<i32>(irradianceFieldSurface.probeCounts.xyz) - 1) ;
            
            var adjacentProbeIndex :i32 = gridCoordToProbeIndex(irradianceFieldSurface, adjacentProbeCoords);
            var adjacentProbeWorldPosition :vec3<f32> = gridCoordToPosition(irradianceFieldSurface, adjacentProbeCoords) ;//+ (wsN + 3.0 * w_o) * globalUniform.normalBias;
         
            var worldPosToAdjProbe = normalize(adjacentProbeWorldPosition - worldPosition);
            var biasedPosToAdjProbe = normalize(adjacentProbeWorldPosition - biasedWorldPosition);
            var biasedPosToAdjProbeDist = length(adjacentProbeWorldPosition - biasedWorldPosition);

            let trilinear = max(vec3<f32>(0.001), mix(1.0 - alpha, alpha, vec3<f32>(adjacentProbeOffset)));
            let trilinearWeight = (trilinear.x * trilinear.y * trilinear.z);
            var weight = 1.0;

            var wrapShading = (dot(worldPosToAdjProbe, direction) + 1.0) * 0.5;
            weight *= (wrapShading * wrapShading) + 0.2;

            var depthDir = -biasedPosToAdjProbe;//probe - world
            depthDir = applyQuaternion(depthDir, quaternion);
            var probeTextureUV : vec2<f32> = textureCoordFromDirection(depthDir.xyz,
                adjacentProbeIndex,
                irradianceFieldSurface.irradianceTextureWidth,
                irradianceFieldSurface.irradianceTextureHeight,
                irradianceFieldSurface.irradianceProbeSideLength);

            var filteredDistance : vec2<f32> = 2.0 * textureSampleLevel(irradianceDepthMap, irradianceDepthMapSampler, probeTextureUV,0.0).rg ;
           
            var variance = abs((filteredDistance.x * filteredDistance.x) - filteredDistance.y);

            var chebyshevWeight = 1.0;
            if(biasedPosToAdjProbeDist > filteredDistance.x ) // occluded
            {
                var v = biasedPosToAdjProbeDist - filteredDistance.x ;
                chebyshevWeight = variance / (variance + (v * v));
                // Increase the contrast in the weight
                chebyshevWeight = max((chebyshevWeight * chebyshevWeight * chebyshevWeight), 0.0);
            }

            weight *= max(0.05, chebyshevWeight);
            weight = max(0.000001, weight);

            let crushThreshold = 0.2;
            if (weight < crushThreshold)
            {
                weight *= (weight * weight) * (1.0 / (crushThreshold * crushThreshold));
            }

            weight *= trilinearWeight;
            
            //worldPosToAdjProbe
            let rotateDir = applyQuaternion(-direction, quaternion);
            probeTextureUV = textureCoordFromDirection((rotateDir),
            adjacentProbeIndex,
            irradianceFieldSurface.irradianceTextureWidth,
            irradianceFieldSurface.irradianceTextureHeight,
            irradianceFieldSurface.irradianceProbeSideLength);

            var probeIrradiance: vec3<f32> = textureSampleLevel(irradianceMap, irradianceMapSampler, probeTextureUV ,0.0).xyz;

            var exponent =  irradianceData.ddgiGamma * 0.5;
            probeIrradiance = pow(probeIrradiance, vec3<f32>(exponent));
            
            irradiance += (weight * probeIrradiance);
            accumulatedWeights += weight;
        }

        if(accumulatedWeights == 0.0){
            return vec4<f32>(0.0, 0.0, 0.0,1.0);
        }

        irradiance *= (1.0 / accumulatedWeights);   
        irradiance *= irradiance;                   

        irradiance *= 6.2831853071795864;     
        irradiance *= irradianceData.indirectIntensity;
        return vec4<f32>(irradiance,1.0) ;
    }

`

