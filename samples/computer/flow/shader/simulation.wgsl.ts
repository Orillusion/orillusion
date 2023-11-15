export class simulation {
    public static cs: string = /* wgsl */ `

        struct InputArgs {
            count: f32,
            time: f32,
            deltatime: f32,
            persistence: f32,
            OCTAVES: f32,
            directionX: f32,
            directionY: f32,
            directionZ: f32,
        };

        @group(0) @binding(0) var<storage, read> input: InputArgs;
        @group(0) @binding(1) var<storage, read_write> position: array<vec4<f32>>;
        @group(0) @binding(2) var<storage, read_write> spawn: array<vec4<f32>>;
        @group(0) @binding(3) var<storage, read_write> newposition: array<vec4<f32>>;
        
        fn mod289v(x: vec4<f32>) -> vec4<f32>{
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        fn mod289(x: f32) -> f32{
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        
        fn permutev(x: vec4<f32>) -> vec4<f32>{
            return mod289v(((x*34.0)+1.0)*x);
        }
        
        fn permute(x: f32) -> f32{
            return mod289(((x*34.0)+1.0)*x);
        }
        
        fn taylorInvSqrtv(r: vec4<f32>) -> vec4<f32>{
            return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        fn taylorInvSqrt(r: f32) -> f32{
            return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        fn grad4(j: f32, ip: vec4<f32>) -> vec4<f32>{
            let ones = vec4(1.0, 1.0, 1.0, -1.0);
            var p: vec4<f32>;
            var s: vec4<f32>;
            p = vec4(floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0, 0.0);
            p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
            s = vec4<f32>(p < vec4(0.0));
            p = vec4(p.xyz + (s.xyz*2.0 - 1.0) * s.www, p.w); 
            return p;
        }
        
        fn simplexNoiseDerivatives(v: vec4<f32>) -> vec4<f32>{
            let C = vec4( 0.138196601125011,0.276393202250021,0.414589803375032,-0.447213595499958);
            let F4 = 0.309016994374947451;
            var i  = floor(v + dot(v, vec4(F4)) );
            var x0 = v -   i + dot(i, C.xxxx);
            var i0: vec4<f32>;
            var isX = step( x0.yzw, x0.xxx );
            var isYZ = step( x0.zww, x0.yyz );
            // i0.x = isX.x + isX.y + isX.z;
            // i0.yzw = 1.0 - isX;
            i0 = vec4(isX.x + isX.y + isX.z, 1.0 - isX);
            i0.y += isYZ.x + isYZ.y;
            // i0.zw += 1.0 - isYZ.xy;
            i0 = vec4(i0.xy, i0.zw + (1.0 - isYZ.xy));
            i0.z += isYZ.z;
            i0.w += 1.0 - isYZ.z;
            var i3 = clamp( i0, vec4<f32>(0.0), vec4<f32>(1.0) );
            var i2 = clamp( i0 - 1.0, vec4<f32>(0.0), vec4<f32>(1.0) );
            var i1 = clamp( i0 - 2.0, vec4<f32>(0.0), vec4<f32>(1.0) );
            var x1 = x0 - i1 + C.xxxx;
            var x2 = x0 - i2 + C.yyyy;
            var x3 = x0 - i3 + C.zzzz;
            var x4 = x0 + C.wwww;
            i = mod289v(i); 
            var j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
            var j1 = permutev( permutev( permutev( permutev (
                    i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
                    + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
                    + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
                    + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
            var ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
            var p0 = grad4(j0,   ip);
            var p1 = grad4(j1.x, ip);
            var p2 = grad4(j1.y, ip);
            var p3 = grad4(j1.z, ip);
            var p4 = grad4(j1.w, ip);
            var norm = taylorInvSqrtv(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            p4 *= taylorInvSqrt(dot(p4,p4));
            var values0 = vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2));
            var values1 = vec2(dot(p3, x3), dot(p4, x4));
            var m0 = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), vec3<f32>(0.0));
            var m1 = max(0.5 - vec2(dot(x3,x3), dot(x4,x4)), vec2<f32>(0.0));
            var temp0 = -6.0 * m0 * m0 * values0;
            var temp1 = -6.0 * m1 * m1 * values1;
            var mmm0 = m0 * m0 * m0;
            var mmm1 = m1 * m1 * m1;
            var dx = temp0[0] * x0.x + temp0[1] * x1.x + temp0[2] * x2.x + temp1[0] * x3.x + temp1[1] * x4.x + mmm0[0] * p0.x + mmm0[1] * p1.x + mmm0[2] * p2.x + mmm1[0] * p3.x + mmm1[1] * p4.x;
            var dy = temp0[0] * x0.y + temp0[1] * x1.y + temp0[2] * x2.y + temp1[0] * x3.y + temp1[1] * x4.y + mmm0[0] * p0.y + mmm0[1] * p1.y + mmm0[2] * p2.y + mmm1[0] * p3.y + mmm1[1] * p4.y;
            var dz = temp0[0] * x0.z + temp0[1] * x1.z + temp0[2] * x2.z + temp1[0] * x3.z + temp1[1] * x4.z + mmm0[0] * p0.z + mmm0[1] * p1.z + mmm0[2] * p2.z + mmm1[0] * p3.z + mmm1[1] * p4.z;
            var dw = temp0[0] * x0.w + temp0[1] * x1.w + temp0[2] * x2.w + temp1[0] * x3.w + temp1[1] * x4.w + mmm0[0] * p0.w + mmm0[1] * p1.w + mmm0[2] * p2.w + mmm1[0] * p3.w + mmm1[1] * p4.w;
            return vec4(dx, dy, dz, dw) * 49.0;
        }
        
        const size = u32(128);
        @compute @workgroup_size(size)
        fn CsMain(
            @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
            @builtin(num_workgroups) GroupSize: vec3<u32>
        ) {
            var index = GlobalInvocationID.x;
            if(index >= u32(input.count)){
                return;
            }
            
            let time = input.time;
            let deltatime = input.deltatime;
            let persistence = input.persistence;
            var OCTAVES = u32(input.OCTAVES);
            let directionX = input.directionX;
            let directionY = input.directionY;
            let directionZ = input.directionZ;
        
            var oldPosition = vec3<f32>(position[index][0], position[index][1], position[index][2]);
            var noisePosition = oldPosition * 1.50000000;
            var noiseTime = time * 0.00025000;
            var xNoisePotentialDerivatives = vec4(0.0);
            var yNoisePotentialDerivatives = vec4(0.0);
            var zNoisePotentialDerivatives = vec4(0.0);
            
            for (var i = u32(0); i < OCTAVES; i++) {
                var scale = (1.0 / 2.0) * pow(2.0, f32(i));
                var noiseScale = pow(persistence, f32(i));
        
                if (persistence == 0.0 && i == u32(0)) {
                    noiseScale = 1.0;
                }
                xNoisePotentialDerivatives += simplexNoiseDerivatives(vec4(noisePosition * pow(2.0, f32(i)), noiseTime)) * noiseScale * scale;
                yNoisePotentialDerivatives += simplexNoiseDerivatives(vec4((noisePosition + vec3(123.4, 129845.6, -1239.1)) * pow(2.0, f32(i)), noiseTime)) * noiseScale * scale;
                zNoisePotentialDerivatives += simplexNoiseDerivatives(vec4((noisePosition + vec3(-9519.0, 9051.0, -123.0)) * pow(2.0, f32(i)), noiseTime)) * noiseScale * scale;
            }
        
            var noiseVelocity = vec3(zNoisePotentialDerivatives[1] - yNoisePotentialDerivatives[2], 
                                    xNoisePotentialDerivatives[2] - zNoisePotentialDerivatives[0],
                                    yNoisePotentialDerivatives[0] - xNoisePotentialDerivatives[1]) * 0.07500000;
            var velocity = vec3(directionX, directionY, directionZ);
            var totalVelocity = velocity + noiseVelocity;
        
            var temp = oldPosition + totalVelocity * deltatime;
        
            var oldLifetime = position[index][3];
            var newLifetime = oldLifetime - deltatime;
            if (newLifetime < 0.0) {
                temp = vec3<f32>(spawn[index][0], spawn[index][1], spawn[index][2]);
                newLifetime = spawn[index][3] + newLifetime;
            }
            
            newposition[index][0] = temp.x;
            newposition[index][1] = temp.y;
            newposition[index][2] = temp.z;
            newposition[index][3] = newLifetime;
        }
    `;
}
