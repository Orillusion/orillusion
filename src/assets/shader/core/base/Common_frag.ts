/**
 * @internal
 */
export let Common_frag: string = /*wgsl*/ `
  #include "GlobalUniform"
  #include "FragmentVarying"
  #include "FragmentOutput"
  #include "ShadingInput"
  #include "ColorUtil_frag"
  #include "BitUtil"

  var<private> ORI_FragmentOutput: FragmentOutput;
  var<private> ORI_VertexVarying: FragmentVarying;
  var<private> ORI_ShadingInput: ShadingInput;
  var<private> viewDir:vec3<f32>;
  var<private> modelIndex:u32;
  
  @fragment
  fn FragMain( vertex_varying:FragmentVarying ) -> FragmentOutput {
   
    modelIndex = u32(round(vertex_varying.index)) ; 

    ORI_VertexVarying = vertex_varying;
    ORI_VertexVarying.vWorldNormal = normalize(vertex_varying.vWorldNormal);
    ORI_FragmentOutput.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;

    frag();
    
    #if USE_DEBUG
      debugFragmentOut();
    #endif

    #if USE_DEFAULTFRAGOUT
      // let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
      // let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
      // let ORI_NORMALMATRIX = transpose(inverse( nMat ));
      // var vNormal = normalize(ORI_NORMALMATRIX * (ORI_VertexVarying.vWorldNormal));

      // let gBuffer = packNHMDGBuffer(
      //   ORI_VertexVarying.fragCoord.z,
      //   ORI_ShadingInput.BaseColor.rgb,
      //   ORI_ShadingInput.BaseColor.rgb,
      //   vec3f(ORI_ShadingInput.Roughness,ORI_ShadingInput.Metallic,ORI_ShadingInput.AmbientOcclusion),
      //   ORI_ShadingInput.Normal,
      //   ORI_ShadingInput.Opacity
      // ) ;
    #endif

    #if USE_OUTDEPTH
      #if USE_LOGDEPTH
        ORI_FragmentOutput.out_depth = log2DepthFixPersp(ORI_VertexVarying.fragPosition.w, globalUniform.near, globalUniform.far);
      #else
        ORI_FragmentOutput.out_depth = ORI_ShadingInput.FragDepth ;
      #endif
    #endif

    return ORI_FragmentOutput ;
  }


  fn packNHMDGBuffer(depth:f32, albedo:vec3f,hdrLighting:vec3f,rmao:vec3f,normal:vec3f,alpha:f32) -> vec4f  {
      var gBuffer : vec4f ;
      var octUVNormal = (octEncode(normalize( (normal) )) + 1.0) * 0.5 ;
      var yc = f32(r11g11b9_to_float(vec3f(octUVNormal,rmao.r))) ;
      #if USE_CASTREFLECTION
        var rgbm = EncodeRGBM(hdrLighting);
        var zc = f32(pack4x8unorm(vec4f(rgbm.rgb,0.0))) ;
        var wc = f32(pack4x8unorm(vec4f(rmao.rg,rgbm.a,0.0)));
      #else
        var zc = f32(vec4fToFloat_7bits(vec4f(albedo.rgb,alpha)));
        var wc = f32(r22g8_to_float(vec2f(f32(modelIndex)/f_r22g8.r,rmao.g)));
      #endif

      gBuffer.x = depth  ;
      gBuffer.y = yc ;
      gBuffer.z = zc ;
      gBuffer.w = wc ;
      return gBuffer ;
  }

  fn transformUV( uv:vec2f , offsetScale:vec4f ) -> vec2f{
     return uv * offsetScale.zw + offsetScale.xy ;
  }

`

