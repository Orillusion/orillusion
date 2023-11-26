export class simulation {
    public static cs: string =  /* wgsl */ `
        struct InputArgs {
            NUM: f32,
            BACKNUM: f32,
            FRONTNUM: f32,
            GRAVITY: f32,
            DELTATIME: f32,
            LENGTHSEGMENT: f32,
            DAMPING: f32,
            HEADX: f32,
            HEADY: f32,
            HEADZ: f32,
            HEADR: f32,
            NEWHEADX: f32,
            NEWHEADY: f32,
            NEWHEADZ: f32,
            NUMVERTICES: f32,
            NUMTSURFACES: f32,
        };

        @group(0) @binding(0) var<storage, read> input: InputArgs;
        @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> velocity: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> anchorposition: array<vec4<f32>>;
        @group(1) @binding(0) var<storage, read_write> tmpposition: array<vec4<f32>>;
        @group(1) @binding(1) var<storage, read_write> output: array<vec4<f32>>;
        
        fn satisfyConstraint(tempposition: vec3<f32>, anchor: vec3<f32>, length: f32) -> vec3<f32>{
            var dir = tempposition - anchor;
            var d = distance(tempposition, anchor);
            if (d > 0.001) {
                var diff = length - d;
                return vec3<f32>(tempposition + dir * diff / d);
            }else {
                return tempposition;
            }
        } 
        
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
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
            @builtin(num_workgroups) GroupSize: vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.NUM)){
                return;
            }
            
            var gravity = input.GRAVITY;
            var deltatime = input.DELTATIME;
            var length = input.LENGTHSEGMENT;
            var headcentre = vec3<f32>(input.HEADX, input.HEADY, input.HEADZ);
            var newheadcentre = vec3<f32>(input.NEWHEADX, input.NEWHEADY, input.NEWHEADZ);
            var headradius = input.HEADR;
        
            var anchor = vec3<f32>(anchorposition[index][0], anchorposition[index][1], anchorposition[index][2]);
            var oldposition = vec3<f32>(position[index][0], position[index][1], position[index][2]);
            var tempvelocity = vec3<f32>(velocity[index][0], velocity[index][1], velocity[index][2]);
            tempvelocity = vec3<f32>(0.0);
            var tempposition = oldposition;
            if (position[index][3] > 0.0) {
                if (distance(headcentre, oldposition) <= (headradius + 0.0)) {
                    tempvelocity = (newheadcentre - headcentre) / deltatime;
                    if ((index < u32(input.BACKNUM) && tempvelocity.x < 0.0) || (index >= u32(input.BACKNUM) && tempvelocity.x > 0.0)){// || tempvelocity.y > 0.0){
                        tempposition = oldposition;// + tempvelocity * deltatime;
                    }
                    else{
                        tempposition = oldposition + tempvelocity * deltatime;
                    }
                }

                // if(distance(newheadcentre, tempposition) < headradius){
                //     var tsphere = intersectSphere(tempposition, -tempvelocity, newheadcentre, headradius);
                //     // output[index][0] = distance(headcentre, tempposition);
                //     tempposition = tempposition - tempvelocity * tsphere;
                //     // output[index][1] = distance(headcentre, tempposition);
                //     // output[index][2] = distance(headcentre, oldposition);
                //     // output[index][3] = tsphere;
                //     // output[index][3] = deltatime;
                // }
                // tempvelocity = (tempposition - oldposition) / deltatime;

                // velocity[index][0] = tempvelocity.x;
                // velocity[index][1] = tempvelocity.y;
                // velocity[index][2] = tempvelocity.z;
                position[index][0] = tempposition.x;
                position[index][1] = tempposition.y;
                position[index][2] = tempposition.z;
                tmpposition[index] = position[index];
                // anchorposition[index + u32(1)] = position[index];
            }
            else{
                position[index][0] = oldposition.x + newheadcentre.x - headcentre.x;
                position[index][1] = oldposition.y + newheadcentre.y - headcentre.y;
                position[index][2] = oldposition.z + newheadcentre.z - headcentre.z;
                tmpposition[index] = position[index];
                anchorposition[index] = position[index];
            }
            var debug = output[index][0];
            // output[index][0] = position[index][0];
            // output[index][1] = anchorposition[index][0];
            // output[index][2] = f32(distance(tempposition, anchor));
            // output[index][3] = f32(distance(oldposition, anchor));
        }
    `;
}
