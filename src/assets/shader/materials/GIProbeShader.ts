export let GIProbeShader: string = /*wgsl*/ `
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "Irradiance_frag"
    #include "MathShader"
    
    struct MaterialUniform {
      probeUniform:vec4<f32>,
    };

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;

    var<private> probeID: i32 ;
    var<private> debugType: i32 ;
    
    fn vert(inputData:VertexAttributes) -> VertexOutput {
        ORI_Vert(inputData) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        probeID = i32(materialUniform.probeUniform.x);
        debugType = i32(materialUniform.probeUniform.y);
        if(debugType == 0){
            ORI_ShadingInput.BaseColor = debugProbe(probeID);
        }else if(debugType == 1){
            ORI_ShadingInput.BaseColor = getIrradiance();
        }else if(debugType == 2){
            ORI_ShadingInput.BaseColor = debugProbeDepth(probeID);
        }
        UnLit();
    }
    `;
