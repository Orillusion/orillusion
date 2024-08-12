/**
 * @internal
 */
export class CubeSky_Shader {
  public static sky_vs_frag_wgsl: string = /* wgsl */ `
    #include "WorldMatrixUniform"
    #include "GlobalUniform"

    struct VertexOutput {
      @location(auto) fragUV: vec2<f32>,
      @location(auto) vClipPos: vec4<f32>,
      @location(auto) vWorldPos: vec4<f32>,
      @location(auto) vWorldNormal: vec3<f32>,
      @builtin(position) member: vec4<f32>
    };

    var<private> ORI_VertexOut: VertexOutput ;

    @vertex
    fn main( 
      @builtin(instance_index) index : u32,
      @location(auto) position: vec3<f32>,
      @location(auto) normal: vec3<f32>,
      @location(auto) uv: vec2<f32>
    ) -> VertexOutput {
      ORI_VertexOut.fragUV = uv;
      let modelMat = models.matrix[u32(index)];
      let vm = modelMat;
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
      ORI_VertexOut.vClipPos = clipPos ;
      ORI_VertexOut.member = clipPos;
      return ORI_VertexOut;
    }
  `

  public static sky_fs_frag_wgsl: string = /* wgsl */ `
    #include "GlobalUniform"
    #include "MathShader"
    #include "BitUtil"
    #include "ColorUtil_frag"
    #include "FragmentOutput"

    struct uniformData {
        exposure: f32,
        roughness: f32
    };

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_cube<f32>;

    @group(2) @binding(0)
    var<uniform> global: uniformData;

    @fragment
    fn main(@location(auto) fragUV: vec2<f32>,@location(auto) vClipPos: vec4<f32>, @location(auto) vWorldPos: vec4<f32>, @location(auto) vWorldNormal: vec3<f32> , @builtin(position) fragCoord : vec4<f32> ) -> FragmentOutput {
        let maxLevel: u32 = textureNumLevels(baseMap);
        let dir = normalize(vWorldPos.xyz);
        var textureColor:vec3<f32> = textureSampleLevel(baseMap, baseMapSampler, normalize(dir.xyz), global.roughness * f32(maxLevel) ).xyz;
        #if IS_HDR_SKY
          textureColor = LinearToGammaSpace(textureColor);
        #endif

        // let o_Target: vec4<f32> = globalUniform.hdrExposure * vec4<f32>(textureColor, 1.0) * globalUniform.skyExposure ;
        let o_Target: vec4<f32> = vec4<f32>(textureColor, 1.0) * globalUniform.skyExposure;
        let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        let ORI_NORMALMATRIX = transpose(inverse( nMat ));
       
        var vNormal = (ORI_NORMALMATRIX * -vWorldNormal );
        var gBuffer = packGBuffer(
          -globalUniform.far,
          vec3f(0.0),
          o_Target.rgb,
          vec3f(0.0),
          vNormal
        ) ;
      var fragmentOutput:FragmentOutput;
      #if USE_CASTREFLECTION
        fragmentOutput.gBuffer = gBuffer ;
      #else
        fragmentOutput.color = o_Target ;
        fragmentOutput.gBuffer = gBuffer ;
      #endif
      return fragmentOutput;
    }

    fn packGBuffer(depth:f32, albedo:vec3f,hdrLighting:vec3f,rmao:vec3f,normal:vec3f) -> vec4f{
        var gBuffer : vec4f ;
        var octUVNormal = (octEncode(normalize(normal)) + 1.0) * 0.5 ;

        var yc = f32(r11g11b9_to_float(vec3f(octUVNormal,0.0))) ;
        #if USE_CASTREFLECTION
          var rgbm = EncodeRGBM(hdrLighting);
          var zc = f32(pack4x8unorm(vec4f(rgbm.rgb,0.0))) ;
          var wc = f32(pack4x8unorm(vec4f(rmao.rg,rgbm.a,0.0)));
        #else
          var zc = f32(vec4fToFloat_7bits(vec4f(albedo.rgb,0.0)));
          var wc = f32(r22g8_to_float(vec2f(f32(0.0),rmao.g)));
        #endif
    
        gBuffer.x = depth  ;
        gBuffer.y = yc ;
        gBuffer.z = zc ;
        gBuffer.w = wc ;
        return gBuffer ;
    }
    `;

}