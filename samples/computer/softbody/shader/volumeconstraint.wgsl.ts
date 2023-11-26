
export class volumeconstraint {
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
        // @group(0) @binding(3) var<storage, read_write> outposition: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> atomicposition: array<atomic<i32>>;
        @group(1) @binding(0) var<storage, read_write> tetids: array<vec4<u32>>;
        @group(1) @binding(1) var<storage, read_write> restvol: array<f32>;
        @group(1) @binding(2) var<storage, read_write> output: array<vec4<f32>>;

        fn getTetVolume(i: u32) -> f32{
            var id0 = tetids[i][0];
            var id1 = tetids[i][1];
            var id2 = tetids[i][2];
            var id3 = tetids[i][3];

            var temp0 = vec3<f32>(inposition[id1][0] - inposition[id0][0], inposition[id1][1] - inposition[id0][1], inposition[id1][2] - inposition[id0][2]);
            var temp1 = vec3<f32>(inposition[id2][0] - inposition[id0][0], inposition[id2][1] - inposition[id0][1], inposition[id2][2] - inposition[id0][2]);
            var temp2 = vec3<f32>(inposition[id3][0] - inposition[id0][0], inposition[id3][1] - inposition[id0][1], inposition[id3][2] - inposition[id0][2]);
            var temp3 = cross(temp0, temp1);

            return dot(temp3, temp2) / 6.0;
        }

        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUMTETS)){
                return;
            }

            var deltatime = input.DELTATIME;
            var compliance = input.VOLCOMPLIANCE;

            var alpha = compliance / deltatime /deltatime;
            var weight = 0.0;
            var volidorder = mat4x3<f32>(1.0,3.0,2.0, 0.0,2.0,3.0, 0.0,3.0,1.0, 0.0,1.0,2.0);
            var index0: u32; var index1: u32; var index2: u32; var index3: u32;
            var temp: mat4x3<f32>; 
            var grad: mat4x3<f32>; 

            for (var j = 0; j < 4; j++) {
                index0 = tetids[index][u32(volidorder[j][0])];
                index1 = tetids[index][u32(volidorder[j][1])];
                index2 = tetids[index][u32(volidorder[j][2])];
                index3 = tetids[index][j];
                temp[0] = vec3<f32>(inposition[index0][0], inposition[index0][1], inposition[index0][2]);
                temp[1] = vec3<f32>(inposition[index1][0], inposition[index1][1], inposition[index1][2]);
                temp[2] = vec3<f32>(inposition[index2][0], inposition[index2][1], inposition[index2][2]);
                grad[j] = cross(temp[1] - temp[0], temp[2] - temp[0]) / 6.0;
                weight += velocity[index3][3] * dot(grad[j], grad[j]);
            }
            // output[index][0] = temp[0].x;
            // output[index][1] = temp[0].y;
            // output[index][2] = temp[0].z;
            // output[index][3] = f32(index3);
            // output[index][3] = f32(index);
            if (weight == 0.0){
                return;
            }
                
            var vol = getTetVolume(index);
            var c = vol - restvol[index];
            var lambda = - c / (weight + alpha);

            for (var j = 0; j < 4; j++) {
                index0 = tetids[index][j];
                temp[3] = grad[j] * lambda * velocity[index0][3];

                atomicAdd(&atomicposition[index0 * u32(4) + u32(0)], i32(temp[3].x * 1000000.0));
                atomicAdd(&atomicposition[index0 * u32(4) + u32(1)], i32(temp[3].y * 1000000.0));
                atomicAdd(&atomicposition[index0 * u32(4) + u32(2)], i32(temp[3].z * 1000000.0));
                atomicAdd(&atomicposition[index0 * u32(4) + u32(3)], i32(1.0));
            }

            var debug = output[index];
            // output[index][0] = 1.0;//vol;
            // output[index][1] = 2.0;//restvol[index];
            // output[index][2] = 3.0;//f32(tetids[index][0]);
            // output[index][3] = 4.0;//newposition[index0][1];

        }
    `;
}