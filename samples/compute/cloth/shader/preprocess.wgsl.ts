export class preprocess {
    public static cs:string = /* wgsl */ `
        struct InputArgs {
            NUMPARTICLES: f32,
            NUMTEDGES: f32,
            NUMTBENDS: f32,
            NUMTSURFACES: f32,
            GRAVITY: f32,
            DELTATIME: f32,
            STRETCHCOMPLIANCE: f32,
            BENDCOMPLIANCE: f32,
            SPHERERADIUS: f32,
            SPHERECENTREX: f32,
            SPHERECENTREY: f32,
            SPHERECENTREZ: f32,
            ALPA: f32,
            rsv0: f32,
            rsv1: f32,
            rsv2: f32,
        };

        @group(0) @binding(0) var<storage, read> input: InputArgs;
        @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> velocity: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> newposition: array<vec4<f32>>;
        @group(1) @binding(0) var<storage, read_write> output: array<vec4<f32>>;
        
        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUMPARTICLES)){
                return;
            }
            var gravity = input.GRAVITY;
            var deltatime = input.DELTATIME;
        
            if(velocity[index][3] == 0.0){
                return;
            }
            var oldposition = vec3<f32>(position[index][0], position[index][1], position[index][2]);
            var tempvelocity = vec3<f32>(velocity[index][0], velocity[index][1], velocity[index][2])
                            + vec3<f32>(0.0, gravity * deltatime, 0.0);
            var tempposition = oldposition + tempvelocity * deltatime;
            // if(tempposition.y < 0.0){
            //     tempposition.x = oldposition.x;
            //     tempposition.y = 0.0;
            //     tempposition.z = oldposition.z;
            // }     
            newposition[index][0] = tempposition.x;
            newposition[index][1] = tempposition.y;
            newposition[index][2] = tempposition.z;
        
            var debug = output[index];
            // output[index][0] = tempposition.x;
            // output[index][1] = tempposition.y;
            // output[index][2] = tempposition.z;
            // output[index][3] = f32(index);
        }
    `;
}