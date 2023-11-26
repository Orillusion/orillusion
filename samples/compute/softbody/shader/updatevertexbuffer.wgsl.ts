export class updatevertexbuffer {
    public static cs: string =/* wgsl */ `
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
        @group(0) @binding(1) var<storage, read> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read> normal: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> vertexBuffer: array<f32>;
        
        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUMTSURFACES)){
                return;
            }
            
            let pos = position[index];
            let nor = normal[index];

            let stride = u32(3+3+2+2);
            index *= stride;
            // update position
            vertexBuffer[index + 0] = pos[0];
            vertexBuffer[index + 1] = pos[1];
            vertexBuffer[index + 2] = pos[2];
            // // update normal
            vertexBuffer[index + 3] = nor[0];
            vertexBuffer[index + 4] = nor[1];
            vertexBuffer[index + 5] = nor[2];
        }
    `;
}
