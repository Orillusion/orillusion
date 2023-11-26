export class copybuffer {
    public static cs: string = /* wgsl */ `
    struct InputArgs {
        NUM: f32,
        GRIDNUM: f32,
        CELLNUM: f32,
        gridResolutionX: f32,
        gridResolutionY: f32,
        gridResolutionZ: f32,
        gridSizeX: f32,
        gridSizeY: f32,
        gridSizeZ: f32,
        timeStep: f32,
        flipness: f32,
        maxDensity: f32,
        mouseVelocityX: f32,
        mouseVelocityY: f32,
        mouseVelocityZ: f32,
        mouseOriginX: f32,
        mouseOriginY: f32,
        mouseOriginZ: f32,
        mouseDirectionX: f32,
        mouseDirectionY: f32,
        mouseDirectionZ: f32,
        rsv0: f32,
        rsv1: f32,
        rsv2: f32,
    };

    @group(0) @binding(0) var<storage, read> input: InputArgs;
    @group(0) @binding(1) var<storage, read_write> pressure: array<f32>;
    @group(0) @binding(2) var<storage, read_write> temppressure: array<f32>;
    @group(0) @binding(3) var<storage, read_write> output: array<vec4<f32>>;
    
    const size = u32(128);
    @compute @workgroup_size(size)
    fn CsMain(
        @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
        @builtin(num_workgroups) GroupSize: vec3<u32>
    ) {
        var index = GlobalInvocationID.x;
        if(index >= u32(input.CELLNUM)){
            return;
        }
        var debug = output[index];
        // output[index][0] = f32(index);
        // output[index][1] = f32(index);
        // output[index][2] = f32(index);
        // output[index][3] = f32(index);
    
        pressure[index] = temppressure[index];
    }
    `;
}
