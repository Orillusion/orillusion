export class Copy {
    public static cs: string = /* wgsl */ `
        struct InputArgs {
            count: f32,
            time: f32,
            deltatime: f32,
            persistence: f32,
            OCTAVES: f32,
            SCALE: f32,
            rsv0: f32,
            rsv1: f32,
        };

        @group(0) @binding(0) var<storage, read> input: InputArgs;
        @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> newposition: array<vec4<f32>>;

        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
            @builtin(num_workgroups) GroupSize: vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.count)){
                return;
            }
            // var debug = output[index];
            // output[index][0] = f32(index);
            // output[index][1] = f32(index);
            // output[index][2] = f32(index);
            // output[index][3] = f32(index);

            position[index] = newposition[index];
        }
    `;
}
