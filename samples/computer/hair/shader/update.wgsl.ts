export class update {
    public static cs: string =  /* wgsl */ `
        struct InputArgs {
            NUM: f32,
            BACKNUM: f32,
            FRONTNUM: f32,
            GRAVITY: f32,
            DELTATIME: f32,
            LENGTHSEGMENT: f32,
            DAMPING: f32,
            HEADX: f32,
            HEADY: f32,
            HEADZ: f32,
            HEADR: f32,
            NEWHEADX: f32,
            NEWHEADY: f32,
            NEWHEADZ: f32,
        };

        @group(0) @binding(0) var<storage, read> input: InputArgs;
        @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> anchorposition: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> newposition: array<vec4<f32>>;
        @group(1) @binding(0) var<storage, read_write> velocity: array<vec4<f32>>;
        @group(1) @binding(1) var<storage, read_write> output: array<vec4<f32>>;
        
        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
            @builtin(num_workgroups) GroupSize: vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUM)){
                return;
            }
        
            var deltatime = input.DELTATIME;
            var damping = input.DAMPING;
        
            if (position[index][3] > 0.0){
                anchorposition[index] = newposition[index - u32(1)];
                var tempvelocity = vec3<f32>(velocity[index - u32(1)][0], velocity[index - u32(1)][1], velocity[index - u32(1)][2]);
                if (anchorposition[index][3] > 0.0){
                    tempvelocity = tempvelocity - vec3<f32>(newposition[index][0] - position[index][0], 
                                                            newposition[index][1] - position[index][1], 
                                                            newposition[index][2] - position[index][2]) * damping / deltatime; 
                    velocity[index - u32(1)][0] = tempvelocity.x;
                    velocity[index - u32(1)][1] = tempvelocity.y;
                    velocity[index - u32(1)][2] = tempvelocity.z;
                }     
            }
            position[index] = newposition[index];
        
            var debug = output[index][0];
            // output[index][0] = distance(vec3<f32>(0.0), vec3<f32>(position[index][0], position[index][1], position[index][2]));
            // output[index][1] = f32(newposition[index][3]);
            // output[index][2] = f32(position[index][3]);
            // output[index][3] = f32((index % u32(input[1])));
        }
    `;
}