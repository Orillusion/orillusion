export let BxdfDebug_frag: string = /*wgsl*/ `
#include "ClusterDebug_frag" 

        fn debugPosition(){
            ORI_FragmentOutput.color = vec4<f32>(ORI_VertexVarying.vWorldPos.xyz,1.0);
        }

        fn debugNormal(){
            ORI_FragmentOutput.color = vec4<f32>(ORI_ShadingInput.Normal.xyz,1.0);
        }

        fn debugUV(){
            ORI_FragmentOutput.color = vec4<f32>(ORI_VertexVarying.fragUV0.xy,0.0,1.0);
        }

        fn debugColor(){
            ORI_FragmentOutput.color = vec4<f32>(fragData.Albedo.rgb,1.0);
        }

        fn debugDiffuse(){
            ORI_FragmentOutput.color = vec4<f32>(1.0/3.1415926 * fragData.Albedo.rgb,1.0);
            // ORI_FragmentOutput.color = vec4<f32>(0.2,0.2,0.2,1.0);
        }

        fn debugAmbient(){
            ORI_FragmentOutput.color = vec4<f32>(fragData.Irradiance * fragData.Albedo.rgb,1.0);
        }
        
        fn debugEmissive(){
            ORI_FragmentOutput.color = vec4<f32>(fragData.Emissive.rgb,1.0);
        }

        fn debugEnvment(){
            ORI_FragmentOutput.color = vec4<f32>(fragData.EnvColor.rgb,1.0);
        }

        fn debugAo(){
            ORI_FragmentOutput.color = vec4<f32>(vec3<f32>(fragData.Ao),1.0);
        }

        fn debugRoughness(){
            ORI_FragmentOutput.color = vec4<f32>(vec3<f32>(fragData.Roughness),1.0);
        }

        fn debugMetallic(){
            ORI_FragmentOutput.color = vec4<f32>(vec3<f32>(fragData.Metallic),1.0);
        }

        fn debugIrradiance(){
            ORI_FragmentOutput.color = vec4<f32>(vec3<f32>(fragData.Irradiance),1.0);
        }

        fn debugFragmentOut(){
            if(ORI_VertexVarying.fragCoord.x > globalUniform.renderState_split) {
                switch (globalUniform.renderState_right)
                {
                  case 0: {
                    debugPosition();
                  }
                  case 1: {
                    debugColor();
                  }
                  case 2: {
                    debugNormal();
                  }
                  case 3: {
                    debugIrradiance();
                  }
                  case 4: {
                    debugDiffuse();
                  }
                  case 5: {
                    // debugAmbient();
                  }
                  case 6: {
                    debugEmissive();
                  }
                  case 7: {
                    debugEnvment();
                  }
                  case 8: {
                    debugAo();
                  }
                  case 9: {
                    debugRoughness();
                  }
                  case 10: {
                    debugMetallic();
                  }
                  case 11: {
                    debugDiffuse();
                  }
                  case 12: {
                    debugAmbient();
                  }
                  case 13: {
                    debugPosition();
                  }
                  case 14: {
                    #if DEBUG_CLUSTER
                      debugCluster( ORI_VertexVarying.fragCoord );
                    #endif
                  }
                  case 15: {
                    #if DEBUG_CLUSTER
                      debugClusterBox( ORI_VertexVarying.fragCoord );
                    #endif
                  }
                  case 16: {
                    #if DEBUG_CLUSTER
                      debugClusterLightCount( vec4<f32>(ORI_VertexVarying.fragCoord.xyz,0.0));
                      #endif
                  }
                  default: {
                  }
                }
              } else {
                switch (globalUniform.renderState_left)
                {
                  case 0: {
                    debugPosition();
                  }
                  case 1: {
                    debugColor();
                  }
                  case 2: {
                    debugNormal();
                  }
                  case 3: {
                    debugIrradiance();
                  }
                  case 4: {
                    debugDiffuse();
                  }
                  case 5: {
                    // debugAmbient();
                  }
                  case 6: {
                    debugEmissive();
                  }
                  case 7: {
                    debugEnvment();
                  }
                  case 8: {
                    debugAo();
                  }
                  case 9: {
                    debugRoughness();
                  }
                  case 10: {
                    debugMetallic();
                  }
                  case 11: {
                    debugDiffuse();
                  }
                  case 12: {
                    debugAmbient();
                  }
                  case 13: {
                    debugPosition();
                  }
                  case 14: {
                    // debugCluster( vec4<f32>(ORI_VertexVarying.fragCoord.xyz,0.0));
                  }
                  case 15: {
                    // debugClusterBox( vec4<f32>(ORI_VertexVarying.fragCoord.xyz,0.0));
                  }
                  case 16: {
                    // debugClusterLightCount( vec4<f32>(ORI_VertexVarying.fragCoord.xyz,0.0));
                  }
                  default: {
                  }
                }
              }
        }
`
