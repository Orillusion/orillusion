export let ZPassShader_fs: string = /*wgsl*/ `
    #include "GlobalUniform"
    #include "MathShader"
    struct FragmentOutput {
        @location(0) o_Target: vec4<f32>,
        @builtin(frag_depth) out_depth: f32
    };
   

    @fragment
    fn main(@location(0) vID: f32, @location(1) vPos:vec3<f32> ,  @location(2) vClipPos: vec4<f32> ,  @builtin(position) fragCoord : vec4<f32>) -> FragmentOutput {
        var op = vec4<f32>( vPos, vID);
        let d = log2Depth(fragCoord.z+0.00001,globalUniform.near,globalUniform.far);
        return FragmentOutput(op,d);
    }
`


