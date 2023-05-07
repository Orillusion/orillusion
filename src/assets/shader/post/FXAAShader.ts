export let FXAAShader: string = /*wgsl*/ `
    struct FragmentOutput {
        @location(0) o_Target: vec4<f32>
    };

    var<private> varying_uv: vec2<f32>;
    @group(1) @binding(0)
    var baseMapSampler: sampler;
    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    struct MaterialUniform{
        u_texel: vec2<f32>,
        u_strength: f32,
    }

    @group(2) @binding(0)
    var<uniform> materialUniform: MaterialUniform;


    fn LinearToGammaSpace(linRGB0: vec3<f32>) -> vec3<f32> {
        var linRGB = max(linRGB0, vec3(0.0, 0.0, 0.0));
        linRGB.r = pow(linRGB.r,0.416666667);
        linRGB.g = pow(linRGB.g,0.416666667);
        linRGB.b = pow(linRGB.b,0.416666667);
        return max(1.055 * linRGB - 0.055, vec3(0.0, 0.0, 0.0));
    }

    fn texture2D( uv:vec2<f32> , offset:vec2<f32> ) -> vec4<f32> {
        return textureSample(baseMap, baseMapSampler, uv.xy + offset ).rgba ;
    }

    @fragment
    fn main(@location(0) fragUV: vec2<f32>) -> FragmentOutput {
        var v_vTexcoord = fragUV ;
        // v_vTexcoord.x = 1.0 - v_vTexcoord.x ;
        v_vTexcoord.y = 1.0 - v_vTexcoord.y ;

        var reducemul = 1.0 / 8.0;
        var reducemin = 1.0 / 128.0;

        var basecol = texture2D(v_vTexcoord , vec2<f32>(0.0)).rgba;
        var baseNW = texture2D(v_vTexcoord , -materialUniform.u_texel).rgb;
        var baseNE = texture2D(v_vTexcoord , vec2<f32>(materialUniform.u_texel.x, -materialUniform.u_texel.y)).rgb;
        var baseSW = texture2D(v_vTexcoord , vec2<f32>(-materialUniform.u_texel.x, materialUniform.u_texel.y)).rgb;
        var baseSE = texture2D(v_vTexcoord , materialUniform.u_texel ).rgb;

        // var gray = vec3<f32>(0.299, 0.587, 0.114);
        var gray = vec3<f32>(0.213, 0.715, 0.072);
        var monocol = dot(basecol.rgb, gray);
        var monoNW = dot(baseNW, gray);
        var monoNE = dot(baseNE, gray);
        var monoSW = dot(baseSW, gray);
        var monoSE = dot(baseSE, gray);

        var monomin = min(monocol, min(min(monoNW, monoNE), min(monoSW, monoSE)));
        var monomax = max(monocol, max(max(monoNW, monoNE), max(monoSW, monoSE)));

        var dir = vec2<f32>(-((monoNW + monoNE) - (monoSW + monoSE)), ((monoNW + monoSW) - (monoNE + monoSE)));
        var dirreduce = max((monoNW + monoNE + monoSW + monoSE) * reducemul * 0.25, reducemin);
        var dirmin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirreduce);
        dir = min(vec2<f32>(materialUniform.u_strength), max(vec2<f32>(-materialUniform.u_strength), dir * dirmin)) * materialUniform.u_texel;

        var resultA = 0.5 * (texture2D(v_vTexcoord , dir * -0.166667).rgb  +
                            texture2D(v_vTexcoord , dir * 0.166667).rgb);
        var resultB = resultA * 0.5 + 0.25 * (texture2D( v_vTexcoord , dir * -0.5).rgb +
                                            texture2D( v_vTexcoord , dir * 0.5).rgb);
        var monoB = dot(resultB.rgb, gray);
        
        var color:vec3<f32> ;
        if(monoB < monomin || monoB > monomax) {
            color = resultA ;//* v_vColour;
        } else {
            color = resultB ;//* v_vColour;
        }
        return FragmentOutput(vec4<f32>(color.rgb,basecol.a));
    }
`

