export let ZPassShader_fs: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(0) o_Target: vec4<f32>
    };

    @fragment
    fn main(@location(0) vID: f32, @location(1) vPos:vec3<f32>) -> FragmentOutput {
        var op = vec4<f32>( vPos, vID);
        return FragmentOutput(op);
    }
`
