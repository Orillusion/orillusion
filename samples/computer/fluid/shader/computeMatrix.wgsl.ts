export class computeMatrix {
    public static cs: string = /* wgsl */ `
    @group(0) @binding(0) var<storage, read_write> _modelView : array<mat4x4<f32>>;
    @group(0) @binding(1) var<storage, read> projection : mat4x4<f32>;
    @group(0) @binding(2) var<storage, read_write> mvp: array<mat4x4<f32>>;
    @group(0) @binding(3) var<storage, read> position: array<vec4<f32>>;
    
    const size = u32(128);
    @compute @workgroup_size(size)
    fn main(
        @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
        @builtin(num_workgroups) GroupSize: vec3<u32>
    ) {
        var index = GlobalInvocationID.x;
        if(index >= GroupSize.x * size){
            return;
        }
        var p:vec4<f32> = position[index];
        _modelView[index][3][0] = p[0] - 15.0;
        _modelView[index][3][1] = p[1];
        _modelView[index][3][2] = p[2] - 10.0;
        mvp[index] = projection * _modelView[index];
    }
    `;
}
