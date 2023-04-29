export let MaterialUniform : string = /*wgsl*/ `
    struct MaterialUniform{
       #if USE_BRDF
        #include "PhysicMaterialUniform_frag"
       #endif

       #if USE_ColorLit
       #endif

       #if USE_UnLit
       #endif
    }

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;
`
