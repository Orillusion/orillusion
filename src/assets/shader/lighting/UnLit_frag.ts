/**
 * @internal
 */
export let UnLit_frag: string = /*wgsl*/ `
    #include "Common_frag"
    #include "GlobalUniform"

    fn UnLit(){
        let alpha = ORI_ShadingInput.BaseColor.a ;
        var viewColor = vec4<f32>(ORI_ShadingInput.BaseColor.rgb * alpha , alpha) ;
        let finalMatrix = globalUniform.projMat * globalUniform.viewMat ;
        let nMat = mat3x3<f32>(finalMatrix[0].xyz,finalMatrix[1].xyz,finalMatrix[2].xyz) ;
        let ORI_NORMALMATRIX = transpose(inverse( nMat ));
        var vNormal = normalize(ORI_NORMALMATRIX * (ORI_VertexVarying.vWorldNormal ));
        let gBuffer = packNHMDGBuffer(
            ORI_VertexVarying.fragCoord.z,
            vec3f(0.0),
            viewColor.rgb,
            // vec3f(0.5),
            vec3f(1.0,0.0,0.0),
            vNormal,
            alpha
          ) ;
  
          #if USE_CASTREFLECTION
            ORI_FragmentOutput.gBuffer = gBuffer ;
          #else
            ORI_FragmentOutput.gBuffer = gBuffer ;
            ORI_FragmentOutput.color = viewColor ;
          #endif
    }

    fn debugFragmentOut(){

    }
`