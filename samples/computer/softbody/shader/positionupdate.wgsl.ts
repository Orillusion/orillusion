export class positionupdate {
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
        @group(0) @binding(1) var<storage, read_write> atomicposition: array<atomic<i32>>;
        @group(0) @binding(2) var<storage, read_write> outposition: array<vec4<f32>>;
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

            var num = f32(atomicLoad(&atomicposition[index * u32(4) + u32(3)]));
            
            outposition[index][0] += f32(atomicLoad(&atomicposition[index * u32(4) + u32(0)])) / (num + 0.0) / 1000000.0;
            outposition[index][1] += f32(atomicLoad(&atomicposition[index * u32(4) + u32(1)])) / (num + 0.0) / 1000000.0;
            outposition[index][2] += f32(atomicLoad(&atomicposition[index * u32(4) + u32(2)])) / (num + 0.0) / 1000000.0;
            atomicStore(&atomicposition[index * u32(4) + u32(0)], i32(0.0));
            atomicStore(&atomicposition[index * u32(4) + u32(1)], i32(0.0));
            atomicStore(&atomicposition[index * u32(4) + u32(2)], i32(0.0));
            atomicStore(&atomicposition[index * u32(4) + u32(3)], i32(0.0));
        
            var debug = output[index];
            // output[index][0] = position0.x;
            // output[index][1] = position0.y;
            // output[index][2] = position[index0][0];
            // output[index][3] = position[index0][1];
        }
    `;
}