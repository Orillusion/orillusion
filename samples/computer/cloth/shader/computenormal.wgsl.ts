export class computenormal {
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
        @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> surfaceinfo: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> atomicnormal: array<atomic<i32>>;
        @group(1) @binding(0) var<storage, read_write> output: array<vec4<f32>>;
        
        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUMTSURFACES)){
                return;
            }
        
            var index0 = u32(surfaceinfo[index][0]);
            var index1 = u32(surfaceinfo[index][1]);
            var index2 = u32(surfaceinfo[index][2]);
            var vector1 = vec3<f32>(position[index1][0] - position[index0][0], position[index1][1] - position[index0][1], position[index1][2] - position[index0][2]);
            var vector2 = vec3<f32>(position[index2][0] - position[index1][0], position[index2][1] - position[index1][1], position[index2][2] - position[index1][2]);
            var temp = cross(vector1, vector2);
            temp = temp / length(temp);
                
            atomicAdd(&atomicnormal[index0 * u32(4) + u32(0)], i32(temp.x * 1000000.0));
            atomicAdd(&atomicnormal[index0 * u32(4) + u32(1)], i32(temp.y * 1000000.0));
            atomicAdd(&atomicnormal[index0 * u32(4) + u32(2)], i32(temp.z * 1000000.0));
            atomicAdd(&atomicnormal[index0 * u32(4) + u32(3)], i32(1.0));
            atomicAdd(&atomicnormal[index1 * u32(4) + u32(0)], i32(temp.x * 1000000.0));
            atomicAdd(&atomicnormal[index1 * u32(4) + u32(1)], i32(temp.y * 1000000.0));
            atomicAdd(&atomicnormal[index1 * u32(4) + u32(2)], i32(temp.z * 1000000.0));
            atomicAdd(&atomicnormal[index1 * u32(4) + u32(3)], i32(1.0));
            atomicAdd(&atomicnormal[index2 * u32(4) + u32(0)], i32(temp.x * 1000000.0));
            atomicAdd(&atomicnormal[index2 * u32(4) + u32(1)], i32(temp.y * 1000000.0));
            atomicAdd(&atomicnormal[index2 * u32(4) + u32(2)], i32(temp.z * 1000000.0));
            atomicAdd(&atomicnormal[index2 * u32(4) + u32(3)], i32(1.0));

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