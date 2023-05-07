export let ColorUtil: string = /*wgsl*/ `
    fn getHDRColor(color: vec3<f32>, exposure: f32) -> vec3 < f32 > {
        // var newColor = color * (  1.0 / 255.0 ) ;
        return color * pow(2.4, exposure) ;
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

    fn gammaToLiner(color: vec4<f32>) -> vec4 < f32 > {
        let gammaCorrect = 2.4;
        var color2 = pow(color, vec4<f32>(gammaCorrect));
        return color2 ;
    }

    fn linerToGamma4(color: vec4<f32>) -> vec4 < f32 > {
        let gammaCorrect = 1.0 / 2.4;
        var color2 = pow(color, vec4<f32>(gammaCorrect));
        return color2 ;
    }

    fn linerToGamma3(color: vec3<f32>) -> vec3 < f32 > {
        let gammaCorrect = 1.0 / 2.4;
        var color2 = pow(color, vec3<f32>(gammaCorrect));
        return color2 ;
    }

    fn LinearToGammaSpace(linRGB0: vec3<f32>) -> vec3 < f32 > {
        var linRGB = max(linRGB0, vec3(0.0, 0.0, 0.0));
        linRGB.r = pow(linRGB.r, 0.416666667);
        linRGB.g = pow(linRGB.g, 0.416666667);
        linRGB.b = pow(linRGB.b, 0.416666667);
        return max(1.055 * linRGB - 0.055, vec3(0.0, 0.0, 0.0));
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
        return min(lin2 * 12.92, pow(max(lin2, vec3<f32>(0.00313067)), vec3<f32>(1.0 / 2.4)) * vec3<f32>(1.055) - vec3<f32>(0.055));
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
`
