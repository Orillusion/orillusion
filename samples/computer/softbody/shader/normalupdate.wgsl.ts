export class normalupdate {
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
            var temp = vec3<f32>(f32(atomicLoad(&atomicnormal[index * u32(4) + u32(0)])) / (num) / 100000000.0,
                                f32(atomicLoad(&atomicnormal[index * u32(4) + u32(1)])) / (num) / 100000000.0,
                                f32(atomicLoad(&atomicnormal[index * u32(4) + u32(2)])) / (num) / 100000000.0);
            temp = temp / length(temp);
            normal[index][0] = temp.x;
            normal[index][1] = temp.y;
            normal[index][2] = temp.z;

            atomicStore(&atomicnormal[index * u32(4) + u32(0)], i32(0.0));
            atomicStore(&atomicnormal[index * u32(4) + u32(1)], i32(0.0));
            atomicStore(&atomicnormal[index * u32(4) + u32(2)], i32(0.0));
            atomicStore(&atomicnormal[index * u32(4) + u32(3)], i32(0.0));
            // outposition[index][0] += temp[index][0] / (input[1] + 10);
            // outposition[index][1] += temp[index][1] / (input[1] + 10);
            // outposition[index][2] += temp[index][2] / (input[1] + 10);
            // temp[index][0] = 0.0;
            // temp[index][1] = 0.0;
            // temp[index][2] = 0.0;

            var debug = output[index];
            // output[index][0] = velocity[index][0];
            // output[index][1] = velocity[index][1];
            // output[index][2] = currentposition.x;
            // output[index][3] = oldposition.x;
            // output[index][2] = tempvelocity.z;
            // output[index][3] = newposition[index0][1];
        }
    `;
}