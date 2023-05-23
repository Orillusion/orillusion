export class CubeSky_Shader {
  public static sky_vs_frag_wgsl: string = /* wgsl */ `
    #include "WorldMatrixUniform"
    #include "GlobalUniform"

    struct VertexOutput {
      @location(0) fragUV: vec2<f32>,
      @location(1) vWorldPos: vec4<f32>,
      @location(2) vWorldNormal: vec3<f32>,
      @builtin(position) member: vec4<f32>
    };

    var<private> ORI_VertexOut: VertexOutput ;

    @vertex
    fn main( 
      @builtin(instance_index) index : u32,
      @location(0) position: vec3<f32>,
      @location(1) normal: vec3<f32>,
      @location(2) uv: vec2<f32>
    ) -> VertexOutput {
      ORI_VertexOut.fragUV = uv;
      let modelMat = models.matrix[u32(index)];
      let vm = globalUniform.viewMat * modelMat;
      let normalMatrix = mat3x3<f32>(vm[0].xyz,vm[1].xyz,vm[2].xyz);
	    ORI_VertexOut.vWorldNormal = normalize( normalMatrix * normal );
      ORI_VertexOut.vWorldPos = modelMat * vec4<f32>(position.xyz,1.0) ;

      var fixProjMat = globalUniform.projMat ;
      fixProjMat[2].z = 1.0 ;//99999.0 / (99999.0 - 1.0) ;
      fixProjMat[3].z = -1.0 ;//(-1.0 * 99999.0) / (99999.0 - 1.0) ;

      var fixViewMat = globalUniform.viewMat ;
      fixViewMat[3].x = 0.0 ;
      fixViewMat[3].y = 0.0 ;
      fixViewMat[3].z = 0.0 ;

      var clipPos = fixProjMat * fixViewMat * ORI_VertexOut.vWorldPos;
      ORI_VertexOut.member = clipPos;
      return ORI_VertexOut;
    }
  `

  public static sky_fs_frag_wgsl: string = /* wgsl */ `
    #include "GlobalUniform"

    struct uniformData {
        exposure: f32,
        roughness: f32
    };

    struct FragmentOutput {
        @location(0) o_Target: vec4<f32>,
        #if USE_WORLDPOS
          @location(1) o_Position: vec4<f32>,
        #endif
        #if USEGBUFFER
          @location(2) o_Normal: vec4<f32>,
          @location(3) o_Material: vec4<f32>
        #endif
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_cube<f32>;

    @group(2) @binding(0)
    var<uniform> global: uniformData;

    fn LinearToGammaSpace(linRGB: vec3<f32>) -> vec3<f32> {
      var linRGB1 = max(linRGB, vec3<f32>(0.0));
      linRGB1 = pow(linRGB1, vec3<f32>(0.4166666567325592));
      return max(((1.0549999475479126 * linRGB1) - vec3<f32>(0.054999999701976776)), vec3<f32>(0.0));
    }

    @fragment
    fn main(@location(0) fragUV: vec2<f32>, @location(1) vWorldPos: vec4<f32>, @location(2) vWorldNormal: vec3<f32>) -> FragmentOutput {
        let maxLevel: u32 = textureNumLevels(baseMap);
        var textureColor:vec3<f32> = textureSampleLevel(baseMap, baseMapSampler, normalize(vWorldPos.xyz), global.roughness * f32(maxLevel) ).xyz;
        #if IS_HDR_SKY
        textureColor = LinearToGammaSpace(textureColor);
        #endif
        let o_Target: vec4<f32> =vec4<f32>(textureColor, 1.0) * globalUniform.skyExposure ;
        var normal_rgba8unorm = (vWorldNormal + 1.0) * 0.5;
        normal_rgba8unorm = clamp(normal_rgba8unorm, vec3<f32>(0.0), vec3<f32>(1.0));

        return FragmentOutput(
          o_Target,
          #if USE_WORLDPOS
              vWorldPos,
          #endif
          #if USEGBUFFER
              vec4<f32>(normal_rgba8unorm,0.0),
              vec4<f32>(0.0,1.0,0.0,0.0)
          #endif
        );
    }
    `;

}