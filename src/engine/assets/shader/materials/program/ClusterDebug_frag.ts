
export let ClusterDebug_frag:string = /*wgsl*/`
        var<private> colorSet : array<vec3<f32>, 9> = array<vec3<f32>, 9>(
            vec3<f32>(1.0, 0.0, 0.0),
            vec3<f32>(1.0, 0.5, 0.0),
            vec3<f32>(0.5, 1.0, 0.0),
            vec3<f32>(0.0, 1.0, 0.0),
            vec3<f32>(0.0, 1.0, 0.5),
            vec3<f32>(0.0, 0.5, 1.0),
            vec3<f32>(0.0, 0.0, 1.0),
            vec3<f32>(0.5, 0.0, 1.0),
            vec3<f32>(1.0, 0.0, 0.5)
        );

        #if DEBUG_CLUSTER
        fn debugCluster(fragCoord:vec4<f32>) {
            #if USE_LIGHT
              var tile : vec3<u32> = getTile(fragCoord);
              let clusterDebug = vec4<f32>(colorSet[u32(tile.z) % 9u], 1.0);
              ORI_FragmentOutput.color = clusterDebug ;
              // ORI_FragmentOutput.color = vec4<f32>(0.5,0.5,0.0,1.0); 
            #endif
          }
      
          fn debugClusterBox(fragCoord:vec4<f32>) {
            #if USE_LIGHT
              let clusterIndex : u32 = getClusterIndex(fragCoord);
              let cluster = clusterBuffer[clusterIndex];
        
              let midPoint : vec3<f32> = (cluster.maxPoint.xyz - cluster.minPoint.xyz) / vec3<f32>(2.0, 2.0, 2.0);
              let center : vec3<f32> = cluster.minPoint.xyz + midPoint;
              let radius : f32 = length(midPoint) ;
        
              let fragToBoundsCenter : vec3<f32> = ORI_VertexVarying.viewPosition.xyz - center;
              let distToBoundsCenter : f32 = length(fragToBoundsCenter);
              let normDist : f32 = distToBoundsCenter / radius;
              ORI_FragmentOutput.color = vec4<f32>(vec3<f32>(normDist,normDist,normDist)  , 1.0);
            #endif
          }
      
          fn debugClusterLightCount(fragCoord:vec4<f32>){
            #if USE_LIGHT
              let clusterIndex : u32 = getClusterIndex(fragCoord);
              let lightCount : u32 = u32(assignTable[clusterIndex].count);
              let lightFactor : f32 = f32(lightCount) / f32(32.0);
              ORI_FragmentOutput.color =  mix(vec4<f32>(0.0, 0.0, 1.0, 1.0), vec4<f32>(1.0, 0.0, 0.0, 1.0), vec4<f32>(lightFactor, lightFactor, lightFactor, lightFactor));
            #endif
          }
          #endif
    `