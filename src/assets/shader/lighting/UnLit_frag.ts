export let UnLit_frag: string = /*wgsl*/ `
    #include "Common_frag"
    #include "GlobalUniform"

    fn UnLit(){
        
        let alpha = ORI_ShadingInput.BaseColor.a ;
        ORI_FragmentOutput.color = vec4<f32>(ORI_ShadingInput.BaseColor.rgb * alpha , alpha) ;

        #if USE_WORLDPOS
            ORI_FragmentOutput.worldPos = vec4<f32>(ORI_VertexVarying.vWorldPos.xyzw);
        #endif

        #if USEGBUFFER
            var normal_rgba8unorm = (ORI_VertexVarying.vWorldNormal + 1.0) * 0.5;
            normal_rgba8unorm = clamp(normal_rgba8unorm, vec3<f32>(0.0), vec3<f32>(1.0));
            ORI_FragmentOutput.worldNormal = vec4<f32>(normal_rgba8unorm,1.0);
            ORI_FragmentOutput.material = vec4<f32>(1.0,1.0,0.0,1.0);
        #endif
    }

    fn debugFragmentOut(){

    }
`