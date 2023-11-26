
export class edgeconstraint {
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
        @group(0) @binding(1) var<storage, read_write> inposition: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> velocity: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> atomicposition: array<atomic<i32>>;
        @group(1) @binding(0) var<storage, read_write> edgeinfo: array<vec4<f32>>;
        @group(1) @binding(1) var<storage, read_write> output: array<vec4<f32>>;

        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUMTEDGES)){
                return;
            }

            var deltatime = input.DELTATIME;
            var compliance = input.EDGECOMPLIANCE;

            var alpha = compliance / deltatime / deltatime;

            var index0 = u32(edgeinfo[index][0]);
            var index1 = u32(edgeinfo[index][1]);
            var weight0 = velocity[index0][3];
            var weight1 = velocity[index1][3];
            var weight = weight0 + weight1;

            if(weight == 0.0){
                return;
            }
            var position0 = vec3<f32>(inposition[index0][0], inposition[index0][1], inposition[index0][2]);
            var position1 = vec3<f32>(inposition[index1][0], inposition[index1][1], inposition[index1][2]);
            var grad = position0 - position1;
            var length = distance(position0, position1);
            if(length == 0.0){
                return;
            }

            grad = grad / length;
            var restlength = edgeinfo[index][2];
            var c = length - restlength;
            var lambda = - c / (weight + alpha);

            var temp0 = grad * lambda * weight0;
            var temp1 = grad * lambda * weight1;

            atomicAdd(&atomicposition[index0 * u32(4) + u32(0)], i32(temp0.x * 1000000.0));
            atomicAdd(&atomicposition[index0 * u32(4) + u32(1)], i32(temp0.y * 1000000.0));
            atomicAdd(&atomicposition[index0 * u32(4) + u32(2)], i32(temp0.z * 1000000.0));
            atomicAdd(&atomicposition[index0 * u32(4) + u32(3)], i32(1.0));
            atomicSub(&atomicposition[index1 * u32(4) + u32(0)], i32(temp1.x * 1000000.0));
            atomicSub(&atomicposition[index1 * u32(4) + u32(1)], i32(temp1.y * 1000000.0));
            atomicSub(&atomicposition[index1 * u32(4) + u32(2)], i32(temp1.z * 1000000.0));
            atomicAdd(&atomicposition[index1 * u32(4) + u32(3)], i32(1.0));

            var debug = output[index];
            // output[index][0] = position0.x;
            // output[index][1] = position0.y;
            // output[index][2] = position[index0][0];
            // output[index][3] = position[index0][1];
        }
    `;
}