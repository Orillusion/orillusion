/**
 * @internal
 */
export let ZPassShader_fs: string = /*wgsl*/ `
    #include "GlobalUniform"
    #include "MathShader"
    struct FragmentOutput {
        @location(auto) o_Target: vec4<f32>,
        @builtin(frag_depth) out_depth: f32
    };
   

    @fragment
    fn main(@location(auto) vID: f32, @location(auto) vPos:vec3<f32> ,  @location(auto) vClipPos: vec4<f32> ,  @builtin(position) fragCoord : vec4<f32>) -> FragmentOutput {
        var op = vec4<f32>( vPos, vID);
        let d = log2Depth(fragCoord.z+0.00001,globalUniform.near,globalUniform.far);
        return FragmentOutput(op,d);
    }
`


