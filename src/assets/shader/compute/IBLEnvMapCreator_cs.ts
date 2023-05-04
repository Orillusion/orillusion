export let IBLEnvMapCreator_cs: string = /*wgsl*/ `
    struct ImageSize {
        srcWidth : i32,
        srcHeight : i32,
        dstWidth : i32,
        dstHeight : i32
    };
    
    @group(0) @binding(0) var<uniform> size : ImageSize;
    @group(0) @binding(1) var<storage,read_write> faceRotation: array<vec4<f32>>;
    @group(0) @binding(2) var inputTexSampler : sampler;
    @group(0) @binding(3) var inputTex : texture_2d<f32>;
    
    @group(1) @binding(0) var<uniform> blurSetting : vec4<f32>;
    @group(1) @binding(1) var outputBuffer0 : texture_storage_2d_array<rgba16float, write>;
    
    var<private> PI: f32 = 3.14159265359;
    
    fn applyQuaternion(position:vec3<f32>, q:vec4<f32>) -> vec3<f32>{
        let x:f32 = position.x;
        let y:f32 = position.y;
        let z:f32 = position.z;
    
        let qx:f32 = q.x;
        let qy:f32 = q.y;
        let qz:f32 = q.z;
        let qw:f32 = q.w;
    
        let ix:f32 = qw * x + qy * z - qz * y;
        let iy:f32 = qw * y + qz * x - qx * z;
        let iz:f32 = qw * z + qx * y - qy * x;
        let iw:f32 = -qx * x - qy * y - qz * z;
    
        var ret: vec3<f32>;
        ret.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        ret.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        ret.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    
        return ret;
    }
    
    fn convertIdToDir3(uv_i32:vec2<i32>, quaternion:vec4<f32>) -> vec3<f32>{
        var uv_f32:vec2<f32> = vec2<f32>(uv_i32.xy);
        var halfSize:f32 = f32(size.dstWidth / 2);
        var worldDirection:vec3<f32> = vec3<f32>(uv_f32.x - halfSize, uv_f32.y - halfSize, -halfSize);
        worldDirection = normalize(worldDirection);
        worldDirection = applyQuaternion(worldDirection, quaternion);
        return worldDirection;
    }
    
    fn VanDerCorpus(n0:u32, base0:u32) -> f32
    {
        var n = n0;
        var base = base0;
        var invBase:f32 = 1.0 / f32(base);
        var denom:f32   = 1.0;
        var result:f32  = 0.0;
    
        for(var i:u32 = 0u; i < 32u; i = i + 1u)
        {
            if(n > 0u)
            {
                denom   = f32(n) % 2.0;
                result = result + denom * invBase;
                invBase = invBase / 2.0;
                n       = u32(f32(n) / 2.0);
            }
        }
    
        return result;
    }
    
    fn HammersleyNoBitOps(i:u32, N:u32) -> vec2<f32>
    {
        return vec2(f32(i)/f32(N), VanDerCorpus(i, 2u));
    }
    
    fn hammersley( i : u32 ,  N : u32 ) -> vec2<f32>
    {
        // Radical inverse based on http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
        var bits = (i << 16u) | (i >> 16u);
        bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
        bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
        bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
        bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
        var rdi = f32(bits) * 2.3283064365386963e-10;
        return vec2<f32>(f32(i) /f32(N), rdi);
    }
    
    fn ImportanceSampleGGX( Xi:vec2<f32>, N:vec3<f32>, roughness:f32) ->vec3<f32>
    {
        var a = roughness*roughness;
    
        var phi = 2.0 * PI * Xi.x;
        var cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
        var sinTheta = sqrt(1.0 - cosTheta*cosTheta);
    
        // from spherical coordinates to cartesian coordinates
        var H:vec3<f32>;
        H.x = cos(phi) * sinTheta;
        H.y = sin(phi) * sinTheta;
        H.z = cosTheta;
    
        // from tangent-space vector to world-space sample vector
        var up:vec3<f32>;
        if(abs(N.z) < 0.999)
        {
            up = vec3<f32>(0.0, 0.0, 1.0);
        }
        else
        {
            up = vec3<f32>(1.0, 0.0, 0.0);
        }
        var tangent:vec3<f32>  = normalize(cross(up, N));
        var bitangent:vec3<f32> = cross(N, tangent);
        var sampleVec:vec3<f32> = tangent * H.x + bitangent * H.y + N * H.z;
        return normalize(sampleVec);
    }
    
    fn multiSample(localPos:vec3<f32>, roughness:f32) -> vec4<f32>
    {
        var N: vec3<f32> = normalize(localPos);
        var R: vec3<f32> = N;
        var V: vec3<f32> = R;
    
        let SAMPLE_COUNT:u32 = 1024u;
        var totalWeight:f32 = 0.0;
        var prefilteredColor:vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
        for(var i:u32 = 0u; i < SAMPLE_COUNT; i = i + 1u)
        {
            var Xi:vec2<f32> = hammersley(i, SAMPLE_COUNT);
            var H :vec3<f32> = ImportanceSampleGGX(Xi, N, roughness);
            var L :vec3<f32> = normalize(2.0 * dot(V, H) * H - V);
    
            var NdotL:f32 = max(dot(N, L), 0.0);
            if(NdotL > 0.0)
            {
                var att = 1.0 ;//( f32(SAMPLE_COUNT - i) / f32(SAMPLE_COUNT)) ;
    
                prefilteredColor = prefilteredColor + sampleColor(L).rgb * NdotL;
                prefilteredColor = prefilteredColor * att ;
                totalWeight      = totalWeight + NdotL;
            }
        }
        prefilteredColor = prefilteredColor / totalWeight;
    
        return vec4<f32>(prefilteredColor, 1.0);
    }
    
    fn SampleSphericalMap(v: vec3<f32>) -> vec2<f32> {
        var uv:vec2<f32> = vec2<f32>(atan2(v.z, v.x), asin(v.y));
        //uv = (uv * (vec2<f32>(0.1590999960899353, 0.3183000087738037) + vec2<f32>(0.0010000000474974513)));
        uv = uv * vec2<f32>(0.1590999960899353, 0.3183000087738037);
        uv = uv + vec2<f32>(0.5);
        uv = clamp(uv, vec2<f32>(0.0), vec2<f32>(1.0));
        return uv;
    }
    
    fn sampleColor(d:vec3<f32>) -> vec4<f32>
    {
        let uv_f32:vec2<f32> = SampleSphericalMap(d);
        let oc = textureSampleLevel(inputTex, inputTexSampler, uv_f32 , 0.0);
        //let dir = vec3<f32>(-d.x, -d.y, d.z);
        //var oc:vec4<f32> = textureSampleLevel(cubeMap, cubeMapSampler, dir, 0.0);
        return oc;
    }
    
    @compute @workgroup_size(8, 8, 1)
    fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
        let coord = vec2<i32>(GlobalInvocationID.xy);
        let quaternion = faceRotation[GlobalInvocationID.z];
        var worldDirection:vec3<f32> = convertIdToDir3(coord, quaternion);
        var oc:vec4<f32> = multiSample(worldDirection, blurSetting.x);
        textureStore(outputBuffer0, coord, i32(GlobalInvocationID.z), oc);
    }

`

