export class postprocess {
    public static cs: string = /* wgsl */ `
        struct InputArgs {
            NUMPARTICLES: f32,
            NUMTETS: f32,
            NUMTEDGES: f32,
            NUMTSURFACES: f32,
            GRAVITY: f32,
            DELTATIME: f32,
            EDGECOMPLIANCE: f32,
            VOLCOMPLIANCE: f32,
            CUBECENTREX: f32,
            CUBECENTREY: f32,
            CUBECENTREZ: f32,
            CUBEWIDTH: f32,
            CUBEHEIGHT: f32,
            CUBEDEPTH: f32,
            rsv0: f32,
            rsv1: f32,
        };

        @group(0) @binding(0) var<storage, read> input: InputArgs;
        @group(0) @binding(1) var<storage, read_write> newposition: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> velocity: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> position: array<vec4<f32>>;
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

            var deltatime = input.DELTATIME;

            if(velocity[index][3] == 0.0){
                return;
            }
            var oldposition = vec3<f32>(position[index][0], position[index][1], position[index][2]);
            var currentposition = vec3<f32>(newposition[index][0], newposition[index][1], newposition[index][2]);
            var tempvelocity = (currentposition - oldposition) / deltatime;
            
            velocity[index][0] = tempvelocity.x;
            velocity[index][1] = tempvelocity.y;
            velocity[index][2] = tempvelocity.z;
            position[index][0] = newposition[index][0];
            position[index][1] = newposition[index][1];
            position[index][2] = newposition[index][2];
                
            var debug = output[index];
            // output[index][0] = velocity[index][0];
            // output[index][1] = velocity[index][1];
            // output[index][2] = velocity[index][2];
            // output[index][3] = f32(index);
            // output[index][2] = tempvelocity.z;
            // output[index][3] = newposition[index0][1];
        }
    `;
}