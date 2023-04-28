
export class Lambert_shader { 
    public static lambert_frag_wgsl = /* wgsl */ `
    #include "FragmentOutput.wgsl"
    #include "LighStruct"
    #include "ColorUtil_frag"

    @group(2) @binding(4)
    var baseMapSampler: sampler;
    @group(2) @binding(5)
    var baseMap: texture_2d<f32>;

    struct StandMaterial {
        transformUV1:vec4<f32>,
        transformUV2:vec4<f32>,
        baseColor: vec4<f32>,
        dirLight: vec4<f32>,
        dirLightColor: vec4<f32>,
        alphaCutoff: f32,
        shadowBias: f32,
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: StandMaterial;

    fn frag(){
        var baseColor = materialUniform.baseColor;
        var alphaCutoff = materialUniform.alphaCutoff;
        var shadowBias = materialUniform.shadowBias;
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * vUv0 + transformUV1.xy;
        var baseMap = textureSample(baseMap, baseMapSampler, uv).xyz;

        let viewDir = normalize(globalUniform.cameraWorldMatrix[3].xyz - vWorldPos.xyz) ;

        let lightIndex = getCluster(builtin_fragCoord);
        let start = max(lightIndex.start, 0.0);
        let count = max(lightIndex.count, 0.0);
        let end = max(start + count , 0.0);
        var color = vec3<f32>(0.0);
        for(var i:i32 = i32(start) ; i < i32(end); i = i + 1 )
        {
          let light = getLight(i) ;
          switch (light.lightType) {
            case PointLightType: {
              let lightingColor = lambert_pointLight( baseMap , viewDir,vWorldNormal,vWorldPos.xyz,light);
              color += lightingColor ;
            }
            case DirectLightType: {
              let lightingColor = lambert_directLight( baseMap , viewDir,vWorldNormal,light.direction,light.lightColor,light.intensity);
              color += lightingColor ;
            }
            case SpotLightType: {

            }
            default: {
            }
          }
        }

        ORI_FragmentOutput.color = vec4<f32>(color, 1.0);
    }
    `;

    public static lambert_vert_wgsl = /* wgsl */ `
      #include "Common_vert"

      fn vert(){

      }
    `;
}