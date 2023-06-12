export let SeaShader: string = /* wgsl */`
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"

    struct MaterialUniform {
        sea_color : vec4<f32> ,
        sea_base_color : vec4<f32>,
        iResolution : vec2<f32>,
    }
      
    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;
    
    const DRAG_MULT : f32 = 0.048 ;
    const ITERATIONS_RAYMARCH : i32 = 13 ;
    const ITERATIONS_NORMAL : i32 = 48 ;

    const octave_m:mat2x2<f32> = mat2x2<f32>(1.6,1.2,-1.2,1.6);

    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    var<private> SEA_TIME:f32 ;
    var<private> iTime:f32 ;
    var<private> iResolution:vec2<f32> ;
    
    fn vert(inputData:VertexAttributes) -> VertexOutput {
        var input = inputData ;
        ORI_Vert(input) ;
        return ORI_VertexOut ;
    }

    fn frag(){
        let vClipPos = ORI_VertexVarying.fragPosition ;
        let wPos = ORI_VertexVarying.vWorldPos ;
        let cameraPos = globalUniform.CameraPos.xyz ;

        iResolution = materialUniform.iResolution ;
        iTime = globalUniform.time ;

        ORI_ShadingInput.BaseColor = vec4<f32>( 1.0)   ;
        UnLit();
    }

    fn wavedx( position: vec2<f32> , direction:vec2<f32> ,  speed:f32 ,  frequency:f32 ,  timeshift:f32 ) -> vec2<f32> {
        var x = dot(direction, position) * frequency + timeshift * speed;
        var wave = exp(sin(x) - 1.0);
        var dx = wave * cos(x);
        return vec2<f32>(wave, -dx);
    }

    fn rotmat2d( angle : f32 ) -> mat2x2<f32> {
        return mat2x2<f32>(cos(angle), -sin(angle), sin(angle), cos(angle));
    }

    fn getwaves( p:vec2<f32> , iterations:i32) -> f32 {
        var position = p ;
        var rotator:mat2x2<f32> = rotmat2d(length(position) * 0.01);
        position *= rotator;
        position *= 0.1;
        position += iTime * 0.2;
        var iter = 0.0;
        var phase = 6.0;
        var speed = 2.0;
        var weight = 1.0;
        var w = 0.0;
        var ws = 0.0;
        for(var i:i32=0;i<iterations;i+=1){
            var p = vec2<f32>(sin(iter), cos(iter));
            var res = wavedx(position, p, speed, phase, iTime);
            position += p * res.y * weight * DRAG_MULT;
            w += res.x * weight;
            iter += 12.0;
            ws += weight;
            weight = mix(weight, 0.0, 0.2);
            phase *= 1.18;
            speed *= 1.07;
        }
        return (w / ws);
    }

    fn raymarchwater( camera:vec3<f32>,  start:vec3<f32>,  end:vec3<f32>,  depth:f32) -> f32{
        var pos = start;
        var h = 0.0;
        var hupper = depth;
        var hlower = 0.0;
        var zer = vec2<f32>(0.0);
        var dir = normalize(end - start);
        for(var i:i32=0;i<318;i+=1){
            h = getwaves(pos.xz, ITERATIONS_RAYMARCH) * depth - depth;
            if(h + 0.01 > pos.y) {
                return distance(pos, camera);
            }
            pos += dir * (pos.y - h);
        }
        return -1.0;
    }

    var<private> H:f32 = 0.0;
    fn normal( pos:vec2<f32>,  e:f32 , depth:f32) -> vec3<f32>{
        var ex = vec2<f32>(e, 0);
        H = getwaves(pos.xy, ITERATIONS_NORMAL) * depth;
        var a = vec3<f32>(pos.x, H, pos.y);
        return normalize(
            cross(
                (a-vec3(pos.x - e, getwaves(pos.xy - ex.xy, ITERATIONS_NORMAL) * depth, pos.y)), 
                (a-vec3(pos.x, getwaves(pos.xy + ex.yx, ITERATIONS_NORMAL) * depth, pos.y + e))
            )
        );
    }

    fn createRotationMatrixAxisAngle( axis:vec3<f32> , angle:f32 ) -> mat3x3<f32>
    {
        var s = sin(angle);
        var c = cos(angle);
        var oc = 1.0 - c;
        return mat3x3<f32>(
            oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 
            oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s, 
            oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
        );
    }

    fn getRay( data:vec2<f32> ) -> vec3<f32>{
        var uv = data ;
        uv = (uv * 2.0 - 1.0) * vec2<f32>(iResolution.x / iResolution.y, 1.0);
        //vec3 proj = normalize(vec3(uv.x, uv.y, 1.0) + vec3(uv.x, uv.y, -1.0) * pow(length(uv), 2.0) * 0.05);	
        var proj = normalize(vec3<f32>(uv.x, uv.y, 1.5));
        if(iResolution.x < 600.0) {
            return proj;
        }
        return createRotationMatrixAxisAngle(vec3(0.0, -1.0, 0.0), 3.0 * (( globalUniform.mouseX + 0.5) * 2.0 - 1.0)) 
                 * createRotationMatrixAxisAngle(vec3(1.0, 0.0, 0.0), 0.5 + 1.5 * (( globalUniform.mouseY * 1.5) * 2.0 - 1.0))
                 * proj;
    }
    
    fn intersectPlane( origin:vec3<f32>,direction:vec3<f32>,point:vec3<f32>,normal:vec3<f32>) -> f32
    { 
        return clamp(dot(point - origin, normal) / dot(direction, normal), -1.0, 9991999.0); 
    }

    fn extra_cheap_atmosphere( raydir:vec3<f32>, sund:vec3<f32>) -> vec3<f32>
    {
        var sundir = sund ;
        sundir.y = max(sundir.y, -0.07);
        var special_trick = 1.0 / (raydir.y * 1.0 + 0.1);
        var special_trick2 = 1.0 / (sundir.y * 11.0 + 1.0);
        var raysundt = pow(abs(dot(sundir, raydir)), 2.0);
        var sundt = pow(max(0.0, dot(sundir, raydir)), 8.0);
        var mymie = sundt * special_trick * 0.2;
        var suncolor = mix(vec3<f32>(1.0), max(vec3<f32>(0.0), vec3<f32>(1.0) - vec3<f32>(5.5, 13.0, 22.4) / 22.4), special_trick2);
        var bluesky= vec3<f32>(5.5, 13.0, 22.4) / 22.4 * suncolor;
        var bluesky2 = max(vec3<f32>(0.0), bluesky - vec3<f32>(5.5, 13.0, 22.4) * 0.002 * (special_trick + -6.0 * sundir.y * sundir.y));
        bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
        return bluesky2 * (1.0 + 1.0 * pow(1.0 - raydir.y, 3.0)) + mymie * suncolor;
    } 

    fn getatm( ray:vec3<f32>) -> vec3<f32>{
        var sd = normalize(vec3<f32>(sin(iTime * 0.1), 1.0, cos(iTime * 0.1))); 
        return extra_cheap_atmosphere(ray, sd) * 0.5;
    }
    
    fn sun( ray:vec3<f32>) -> f32 { 
        var sd = normalize(vec3<f32>(sin(iTime * 0.1), 1.0, cos(iTime * 0.1))); 
        return pow(max(0.0, dot(ray, sd)), 720.0) * 210.0;
    }

    fn aces_tonemap( color:vec3<f32>) -> vec3<f32> {	
        var m1 = mat3x3<f32>(
            0.59719, 0.07600, 0.02840,
            0.35458, 0.90834, 0.13383,
            0.04823, 0.01566, 0.83777
        );
        var m2 = mat3x3<f32>(
            1.60475, -0.10208, -0.00327,
            -0.53108,  1.10813, -0.07276,
            -0.07367, -0.00605,  1.07602
        );
        var v = m1 * color;    
        var a = v * (v + 0.0245786) - 0.000090537;
        var b = v * (0.983729 * v + 0.4329510) + 0.238081;
        return pow(clamp(m2 * (a / b), vec3<f32>(0.0), vec3<f32>(0.0) ), vec3<f32>(1.0 / 2.2));	
    }
 
`;
