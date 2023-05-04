export let LightStruct: string = /*wgsl*/ `
    struct LightData {
        index:f32,
        lightType:i32,
        radius:f32,
        linear:f32,
        
        position:vec3<f32>,
        lightMatrixIndex:f32,

        direction:vec3<f32>,
        quadratic:f32,

        lightColor:vec3<f32>,
        intensity:f32,

        innerCutOff :f32,
        outerCutOff:f32,
        range :f32,
        castShadow:i32,

        lightTangent:vec3<f32>,
        ies:f32,
    };

    const PointLightType = 1;
    const DirectLightType = 2;
    const SpotLightType = 3;

    struct ClusterBox {
        minPoint:vec4<f32>,
        maxPoint:vec4<f32>
    };

    struct LightIndex {
            count:f32,
            start:f32,
            empty0:f32,
            empty1:f32,
    };

    struct ClustersUniform {
        clusterTileX:f32,
        clusterTileY:f32,
        clusterTileZ:f32,
        numLights:f32,
        maxNumLightsPerCluster:f32,
        near:f32,
        far:f32,
        screenWidth:f32,
        screenHeight:f32,
        clusterPix:f32, 
    };

    @group(2) @binding(1)
    var<storage,read> lightBuffer: array<LightData>;
    @group(2) @binding(2)
    var<uniform> clustersUniform : ClustersUniform;
    @group(2) @binding(3)
    var<storage,read> lightAssignBuffer : array<f32>;
    @group(2) @binding(4)
    var<storage,read> assignTable : array<LightIndex>;
    #if DEBUG_CLUSTER
        @group(2) @binding(5)
        var<storage,read> clusterBuffer : array<ClusterBox>;
    #endif

    fn getLight( index:i32 ) -> LightData {
        let lightId = i32(lightAssignBuffer[index]);
        var lightData = lightBuffer[lightId];
        return lightData ;
    }

    fn linear01Depth(depth : f32) -> f32 {
        return globalUniform.far * globalUniform.near / fma(depth, globalUniform.near-globalUniform.far, globalUniform.far);
    }

    fn getTile(fragCoord : vec4<f32>) -> vec3<u32> {
        var coord = fragCoord ; 
        coord.z = linear01Depth(coord.z) ; 

        let sliceScale = f32(clustersUniform.clusterTileZ) / log2(globalUniform.far / globalUniform.near);
        let sliceBias = -(f32(clustersUniform.clusterTileZ) * log2(globalUniform.near) / log2(globalUniform.far / globalUniform.near));
        let zTile = u32(max(log2(coord.z) * sliceScale + sliceBias, 0.0));
        return vec3<u32>(u32(coord.x / (clustersUniform.screenWidth / f32(clustersUniform.clusterTileX))),
                            u32(coord.y / (clustersUniform.screenHeight / f32(clustersUniform.clusterTileY))),
                            zTile);
    }

    fn getCluster(fragCoord : vec4<f32>) -> LightIndex {
        let tile = getTile(fragCoord);
        let id = tile.x +
            tile.y * u32(clustersUniform.clusterTileX) +
            tile.z * u32(clustersUniform.clusterTileX) * u32(clustersUniform.clusterTileY);
        return assignTable[id];
    }

    #if DEBUG_CLUSTER
        fn getClusterIndex(fragCoord : vec4<f32>) -> u32 {
            let tile = getTile(fragCoord);
            let id = tile.x +
                tile.y * u32(clustersUniform.clusterTileX) +
                tile.z * u32(clustersUniform.clusterTileX) * u32(clustersUniform.clusterTileY);
            return id;
            // return 0u ;
        }
    #endif
`
