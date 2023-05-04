// The basic class that introduces basic vertex shaders includes algorithms for general built-in functions, and ultimately built-in variables
#include "Common_vert" 
// The basic class that introduces basic vertex shaders includes algorithms for general built-in functions, and ultimately built-in variables
#include "Common_frag" 

// Not introducing light
#include "UnLit_frag"

/** There is currently no way to dynamically bind groups, and default maps need to be used to fill in the gaps**/
@group(1) @binding(0)
var baseMapSampler: sampler;
@group(1) @binding(1)
var baseMap: texture_2d<f32>;
/****/

struct MaterialUniform {
   baseColor: vec4<f32>,
};

//The parameter for this material must be group2
@group(2) @binding(0)
var<uniform> materialUniform: MaterialUniform;

//User entry point for vertex shaders
fn vert(inputData:VertexAttributes) -> VertexOutput {
    ORI_Vert(inputData) ;
    return ORI_VertexOut ;
}

//User entry for fragment shaders
fn frag(){
    let color = textureSample(baseMap,baseMapSampler,ORI_VertexVarying.fragUV0) ;
    ORI_ShadingInput.BaseColor = color * materialUniform.baseColor ;
    UnLit();
}


// { // First pass
//     pass{
//         shaderState:{
//             depthCompare:less,
//             depthWrite:true
//         }

//         #include "Common_vert"
//         #include "Common_frag"

//         vert(){

//         }

//         frag(){

//         }
//     }
//     pass{
//         shaderState:{
//             depthCompare:less
//         }

//         #include "Common_vert"
//         #include "Common_frag"

//         vert(){

//         }

//         frag(){

//         }
//     }
// }