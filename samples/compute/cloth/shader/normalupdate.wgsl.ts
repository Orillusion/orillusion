export class normalupdate {
    public static cs: string = /* wgsl */ `
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
        @group(0) @binding(1) var<storage, read_write> atomicnormal: array<atomic<i32>>;
        @group(0) @binding(2) var<storage, read_write> normal: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> output: array<vec4<f32>>;
        
        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUMPARTICLES)){
                return;
            }
    
            var num = f32(atomicLoad(&atomicnormal[index * u32(4) + u32(3)]));
            var temp = vec3<f32>(f32(atomicLoad(&atomicnormal[index * u32(4) + u32(0)])) / (num) / 1000000.0,
                                 f32(atomicLoad(&atomicnormal[index * u32(4) + u32(1)])) / (num) / 1000000.0,
                                 f32(atomicLoad(&atomicnormal[index * u32(4) + u32(2)])) / (num) / 1000000.0);
            // temp = temp / length(temp);
            normal[index][0] = temp.x;
            normal[index][1] = temp.y;
            normal[index][2] = temp.z;
            atomicStore(&atomicnormal[index * u32(4) + u32(0)], i32(0.0));
            atomicStore(&atomicnormal[index * u32(4) + u32(1)], i32(0.0));
            atomicStore(&atomicnormal[index * u32(4) + u32(2)], i32(0.0));
            atomicStore(&atomicnormal[index * u32(4) + u32(3)], i32(0.0));
        
            var debug = output[index];
            // output[index][0] = f32(index);
            // output[index][1] = normal[index][0];
            // output[index][2] = normal[index][0];
            // output[index][3] = normal[index][1];
        }
    `;
}