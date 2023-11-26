export class postprocess {
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
        @group(0) @binding(1) var<storage, read_write> newposition: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> velocity: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> position: array<vec4<f32>>;
        @group(1) @binding(0) var<storage, read_write> output: array<vec4<f32>>;
        
        fn intersectSphere(origin: vec3<f32>, ray: vec3<f32>, spherecenter: vec3<f32>, sphereradius: f32) -> f32{   
            var tosphere = origin - spherecenter;   
            var a = dot(ray, ray);   
            var b = 2.0 * dot(tosphere, ray);   
            var c = dot(tosphere, tosphere) - sphereradius*sphereradius;   
            var discriminant = b*b - 4.0*a*c;   
            if(discriminant > 0.0) {     
                var t = (-b - sqrt(discriminant)) / (2.0 * a);     
                if(t > 0.0) {
                    return t;
                }   
            }   
            return 0.0; 
        }
        
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
            var spherecentre = vec3<f32>(input.SPHERECENTREX, input.SPHERECENTREY, input.SPHERECENTREZ);
            var sphereradius = input.SPHERERADIUS;
        
            if(velocity[index][3] == 0.0){
                return;
            }
            var oldposition = vec3<f32>(position[index][0], position[index][1], position[index][2]);
            var currentposition = vec3<f32>(newposition[index][0], newposition[index][1], newposition[index][2]);
        
            var tempvelocity = (currentposition - oldposition) / deltatime;
            if(distance(spherecentre, currentposition) < sphereradius){
                var ray = currentposition - spherecentre;
                // var tsphere = intersectSphere(oldposition, ray, spherecentre, sphereradius);
                currentposition = currentposition + ray * (sphereradius - distance(spherecentre, currentposition));
                tempvelocity = (currentposition - oldposition) / deltatime;
                // output[index][0] = distance(spherecentre, currentposition);
                // output[index][1] = ray.z;
                // output[index][2] = ray.x;
                // output[index][3] = ray.y;
            }
            
            velocity[index][0] = tempvelocity.x;
            velocity[index][1] = tempvelocity.y;
            velocity[index][2] = tempvelocity.z;
            position[index][0] = newposition[index][0];
            position[index][1] = newposition[index][1];
            position[index][2] = newposition[index][2];
                
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