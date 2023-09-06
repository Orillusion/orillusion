
export let ClusterDebug_frag: string = /*wgsl*/`
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
              var tileID : u32 = getClusterId3().z;
              let clusterDebug = vec4<f32>(colorSet[tileID % 9u], 1.0);
              ORI_FragmentOutput.color = clusterDebug ;
            #endif
          }
      
          fn debugClusterBox(fragCoord:vec4<f32>) {
            #if USE_LIGHT
              let clusterId3 : vec3<u32> = getClusterId3();
              let px = f32(clusterId3.x) / clustersUniform.clusterTileX ;
              let py = f32(clusterId3.y) / clustersUniform.clusterTileY ;
              let pz = f32(clusterId3.z) / clustersUniform.clusterTileZ ;
              ORI_FragmentOutput.color = vec4<f32>(px,py,pz, 1.0);

              var screenUV = ORI_VertexVarying.fragCoord.xy / vec2<f32>( globalUniform.windowWidth , globalUniform.windowHeight );
              ORI_FragmentOutput.color = vec4<f32>(screenUV.x,screenUV.y,0.0, 1.0);

              // let clusterId : u32 = getClusterIndex();
              // let cluster = clusterBuffer[clusterId];
        
              // let midPoint : vec3<f32> = (cluster.maxPoint.xyz - cluster.minPoint.xyz) * vec3<f32>(0.5);
              // let center : vec3<f32> = cluster.minPoint.xyz + midPoint;
              // let radius : f32 = length(midPoint) ;
        
              // let fragToBoundsCenter : vec3<f32> = ORI_VertexVarying.viewPosition.xyz - center;
              // let distToBoundsCenter : f32 = length(fragToBoundsCenter);
              // let normDist : f32 = distToBoundsCenter / radius;
              // ORI_FragmentOutput.color = vec4<f32>(normDist,normDist,normDist, 1.0);
            #endif
          }
      
          fn debugClusterLightCount(fragCoord:vec4<f32>){
            #if USE_LIGHT
            //LightIndex
              let cluster : LightIndex = getCluster();
              let lightCount : u32 = u32(cluster.count);
              let lightFactor : f32 = f32(lightCount) / f32(clustersUniform.maxNumLightsPerCluster);
              ORI_FragmentOutput.color =  mix(vec4<f32>(0.0, 0.0,0.0, 1.0), vec4<f32>(1.0, 1.0, 1.0, 1.0), vec4<f32>(lightFactor, lightFactor, lightFactor, lightFactor));
            #endif
          }
          #endif
    `