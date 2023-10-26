export let Common_frag: string = /*wgsl*/ `
  #include "GlobalUniform"
  #include "FragmentVarying"
  #include "ColorPassFragmentOutput"
  #include "ShadingInput"

  var<private> ORI_FragmentOutput: FragmentOutput;
  var<private> ORI_VertexVarying: FragmentVarying;
  var<private> ORI_ShadingInput: ShadingInput;
  var<private> viewDir:vec3<f32>;
  var<private> modelIndex:u32;
  @fragment
  fn FragMain( vertex_varying:FragmentVarying ) -> FragmentOutput {
    modelIndex = u32(round(vertex_varying.index)) ; 

    ORI_VertexVarying = vertex_varying;
    ORI_FragmentOutput.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;
    #if USE_WORLDPOS
      ORI_FragmentOutput.worldPos = ORI_VertexVarying.vWorldPos;
    #endif
    #if USEGBUFFER
      ORI_FragmentOutput.worldNormal = vec4<f32>(ORI_ShadingInput.Normal.rgb ,1.0); 
      ORI_FragmentOutput.material = vec4<f32>(0.0,1.0,0.0,0.0);
    #endif
    frag();
    
    #if USE_DEBUG
      debugFragmentOut();
    #endif

    #if USE_OUTDEPTH
      #if USE_LOGDEPTH
        ORI_FragmentOutput.out_depth = log2Depth(ORI_VertexVarying.fragCoord.z,globalUniform.near,globalUniform.far) ;
      #else
        ORI_FragmentOutput.out_depth = ORI_ShadingInput.FragDepth ;
      #endif
    #endif

    return ORI_FragmentOutput ;
  }


`

