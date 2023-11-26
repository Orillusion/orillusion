
export class preprocess {
    public static cs:string = /* wgsl */ `
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

            var eps = 0.01;
            var gravity = input.GRAVITY;
            var deltatime = input.DELTATIME;
            var cubeCentre = vec3<f32>(input.CUBECENTREX, input.CUBECENTREY, input.CUBECENTREZ);
            var cubeWidth = input.CUBEWIDTH / 2.0 - eps;
            var cubeHeight = input.CUBEHEIGHT / 2.0 - eps;
            var cubeDepth = input.CUBEDEPTH / 2.0 - eps;

            if(velocity[index][3] == 0.0){
                return;
            }
            var oldposition = vec3<f32>(position[index][0], position[index][1], position[index][2]);
            var tempvelocity = vec3<f32>(velocity[index][0], velocity[index][1], velocity[index][2])
                            + vec3<f32>(0.0, gravity * deltatime, 0.0);
            var tempposition = oldposition + tempvelocity * deltatime;

            if(tempposition.x < cubeCentre.x - cubeWidth){
                tempposition.x = cubeCentre.x - cubeWidth;
                tempposition.y = oldposition.y;
                tempposition.z = oldposition.z;
            }    
            if(tempposition.x > cubeCentre.x + cubeWidth){
                tempposition.x = cubeCentre.x + cubeWidth;
                tempposition.y = oldposition.y;
                tempposition.z = oldposition.z;
            }  
            if(tempposition.y < cubeCentre.y - cubeHeight){
                tempposition.x = oldposition.x;
                tempposition.y = cubeCentre.y - cubeHeight;
                tempposition.z = oldposition.z;
            }    
            if(tempposition.y > cubeCentre.y + cubeHeight){
                tempposition.x = oldposition.x;
                tempposition.y = cubeCentre.y + cubeHeight;
                tempposition.z = oldposition.z;
            }  
            if(tempposition.z < cubeCentre.z - cubeDepth){
                tempposition.x = oldposition.x;
                tempposition.y = oldposition.y;
                tempposition.z = cubeCentre.z - cubeDepth;
            }    
            if(tempposition.z > cubeCentre.z + cubeDepth){
                tempposition.x = oldposition.x;
                tempposition.y = oldposition.y;
                tempposition.z = cubeCentre.z + cubeDepth;
            }  
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