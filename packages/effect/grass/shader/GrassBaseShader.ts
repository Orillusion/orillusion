export let GrassBaseShader = /*wgsl*/ `
    #include "GlobalUniform"
    #include "ColorPassFragmentOutput"
    #include "ShadingInput"
 
    struct FragmentVarying {
        @location(0) fragUV0: vec2<f32>,
        @location(1) fragUV1: vec2<f32>,
        @location(2) viewPosition: vec4<f32>,
        @location(3) fragPosition: vec4<f32>,
        @location(4) vWorldPos: vec4<f32>,
        @location(5) vWorldNormal: vec3<f32>,
        @location(6) vColor: vec4<f32>,

        #if USE_SHADOWMAPING
            @location(7) vShadowPos: vec4<f32>,
        #endif

        #if USE_TANGENT
            @location(8) TANGENT: vec4<f32>,
        #endif
        
        @builtin(front_facing) face: bool,
        @builtin(position) fragCoord : vec4<f32>
    };

    var<private> ORI_FragmentOutput: FragmentOutput;
    var<private> ORI_VertexVarying: FragmentVarying;
    var<private> ORI_ShadingInput: ShadingInput;

    @fragment
    fn FragMain( vertex_varying:FragmentVarying ) -> FragmentOutput {
      ORI_VertexVarying = vertex_varying;
      ORI_FragmentOutput.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
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
  
      return ORI_FragmentOutput ;
`