/**
 * @internal
 */
export let ColorUtil: string = /*wgsl*/ `
    fn getHDRColor(color: vec3<f32>, exposure: f32) -> vec3 < f32 > {
        return color * pow(2.4, exposure) ;
    }

    // RGBM encode/decode
    const kRGBMRange = 8.0;

    fn EncodeRGBM( icolor : vec3f ) ->vec4f
    {
        var color = icolor ;
        color *= 1.0 / kRGBMRange;
        var m = max(max(color.x, color.y), max(color.z, 1e-5));
        m = ceil(m * 255) / 255;
        return vec4f(color / m, m);
    }

    fn DecodeRGBM( rgbm : vec4f ) -> vec3f
    {
        return rgbm.xyz * rgbm.w * kRGBMRange;
    }

    fn Luminance(  LinearColor : vec3f, LuminanceFactors: vec3f ) -> f32
    {
        return dot( LinearColor, LuminanceFactors );
    }

    fn lambda2rgb(lambda : f32) -> vec3 < f32 > {
        let ultraviolet = 400.0;
        let infrared = 700.0;

        var a = (lambda - ultraviolet) / (infrared - ultraviolet);
        let c = 10.0;
        var b = vec3<f32>(a) - vec3<f32>(0.75, 0.5, 0.25);
        return max((1.0 - c * b * b), vec3<f32>(0.0));
    }

    fn CEToneMapping(color: vec3<f32>, adapted_lum: f32) -> vec3<f32>
    {
        return 1.0 - exp(-adapted_lum * color);
    }


    fn acesFilm( x:vec3f) -> vec3f {
        return clamp((x*(2.51*x+vec3f(0.03)))/(x*(2.43*x+vec3f(0.59))+vec3f(0.14)),vec3f(0.0),vec3f(1.0));
    }

    fn ACESToneMapping(color: vec3<f32>, adapted_lum: f32) -> vec3<f32>
    {
        let A = 2.51;
        let B = 0.03;
        let C = 2.43;
        let D = 0.59;
        let E = 0.14;

        var color2 = color * adapted_lum;
        color2 = (color2 * (A * color2 + B)) / (color2 * (C * color2 + D) + E);
        return color2;
    }

    fn gammaToLiner(color: vec3<f32>) -> vec3 < f32 > {
        let gammaCorrect = 2.4;
        var color2 = pow(color, vec3<f32>(gammaCorrect));
        return color2 ;
    }

    fn linerToGamma4(color: vec4<f32>) -> vec4 < f32 > {
        let gammaCorrect = 0.416666667;
        var color2 = pow(color, vec4<f32>(gammaCorrect));
        return color2 ;
    }

    fn linerToGamma3(color: vec3<f32>) -> vec3 < f32 > {
        let gammaCorrect = 0.416666667;
        var color2 = pow(color, vec3<f32>(gammaCorrect));
        return color2 ;
    }

    // fn LinearToGammaSpace(linRGB0: vec3<f32>) -> vec3 < f32 > {
    //     var linRGB = max(linRGB0, vec3(0.0, 0.0, 0.0));
    //     linRGB.r = pow(linRGB.r, 0.416666667);
    //     linRGB.g = pow(linRGB.g, 0.416666667);
    //     linRGB.b = pow(linRGB.b, 0.416666667);
    //     return max(1.055 * linRGB - 0.055, vec3(0.0, 0.0, 0.0));
    // }

    fn LinearToGammaSpace(linRGB: vec3<f32>) -> vec3<f32> {
        var linRGB1 = max(linRGB, vec3<f32>(0.0));
        linRGB1 = pow(linRGB1, vec3<f32>(0.4166666567325592));
        return max(((1.0549999475479126 * linRGB1) - vec3<f32>(0.054999999701976776)), vec3<f32>(0.0));
    }

    var<private>sRGB_2_LMS_MAT: mat3x3<f32> = mat3x3<f32>(
        17.8824, 43.5161, 4.1193,
        3.4557, 27.1554, 3.8671,
        0.02996, 0.18431, 1.4670,
    );

    var<private>LMS_2_sRGB_MAT: mat3x3<f32> = mat3x3<f32>(
        0.0809, -0.1305, 0.1167,
        -0.0102, 0.0540, -0.1136,
        -0.0003, -0.0041, 0.6935,
    );

    fn sRGB_2_LMS(RGB: vec3<f32>) -> vec3<f32>
    {
        return sRGB_2_LMS_MAT * RGB;
    }

    fn LMS_2_sRGB(LMS: vec3<f32>) -> vec3<f32>
    {
        return LMS_2_sRGB_MAT * LMS;
    }

    fn LinearToSrgbBranchless(lin: vec3<f32>) -> vec3<f32>
    {
        var lin2 = max(vec3<f32>(6.10352e-5), lin);
        return min(lin2 * 12.92, pow(max(lin2, vec3<f32>(0.00313067)), vec3<f32>(0.416666667)) * vec3<f32>(1.055) - vec3<f32>(0.055));
    }

    fn sRGBToLinear(color : vec3<f32>) -> vec3<f32>
    {
        let color2 = max(vec3<f32>(6.10352e-5), color);
        let c = 0.04045;
        if (color2.r > c && color2.g > c && color2.b > c) {
            return pow(color2 * (1.0 / 1.055) + 0.0521327, vec3<f32>(2.4));
        } else {
            return color2 * (1.0 / 12.92);
        }
    }

    fn BlendNormalRNM( n1:vec3f,  n2:vec3f) -> vec3f
	{
		let t = n1.xyz + vec3f(0.0, 0.0, 1.0);
		let u = n2.xyz * vec3f(-1.0, -1.0, 1.0);
		let r = (t / t.z) * dot(t, u) - u;
		return r;
	}

//     fn ReorientedBlendNormal(){
//         vec3 t = texture(baseMap,   uv).xyz * vec3( 2.0,  2.0, 2.0) + vec3(-1.0, -1.0,  0.0);
// vec3 u = texture(detailMap, uv).xyz * vec3(-2.0, -2.0, 2.0) + vec3( 1.0,  1.0, -1.0);
// vec3 r = normalize(t * dot(t, u) - u * t.z);
// return r;
//     }

//     fn UDNBlendNormal(){
    // vec3 t = texture(baseMap,   uv).xyz * 2.0 - 1.0;
    // vec3 u = texture(detailMap, uv).xyz * 2.0 - 1.0;
    // vec3 r = normalize(t.xy + u.xy, t.z);
    // return r;
//     }


fn packRGBA8( In : vec4f ) ->u32
{
	let r = (u32(saturate(In.r) * 255.0) << 0u);
	let g = (u32(saturate(In.g) * 255.0) << 8u);
	let b = (u32(saturate(In.b) * 255.0) << 16u);
	let a = (u32(saturate(In.a) * 255.0) << 24u);
	return r | g | b | a;
}

const i256:f32 = 1.0 / 255.0 ;
fn unpackRGBA8( In : u32 ) -> vec4f 
{
	var Out:vec4f ;
	Out.r = f32((In >> 0u) & 0xFF) * i256;
	Out.g = f32((In >> 8u) & 0xFF) * i256;
	Out.b = f32((In >> 16u) & 0xFF) * i256;
	Out.a = f32((In >> 24u) & 0xFF) * i256;
	return Out;
}
`
