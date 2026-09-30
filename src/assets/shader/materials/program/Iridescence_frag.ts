/**
 * KHR_materials_iridescence — thin-film interference (soap bubbles, oil
 * slicks, beetle shells, anodized metal). Port of Belcour & Barla 2017 as
 * used by the Khronos sample viewer and three.js: the film modifies the
 * surface Fresnel as a function of view angle, film IOR and thickness.
 *
 * `materialUniform.iridescence` = (factor, film IOR, film thickness in nm, unused).
 * `IridescenceUtil` mirrors this file on the CPU.
 * @internal
 */
export let Iridescence_frag: string = /*wgsl*/ `
  #if USE_IRIDESCENCE
    fn iriPow2(x: f32) -> f32 { return x * x; }
    fn iriPow2v(x: vec3<f32>) -> vec3<f32> { return x * x; }

    fn iriSchlickF(f0: f32, cosTheta: f32) -> f32 {
        let x = clamp(1.0 - cosTheta, 0.0, 1.0);
        let x5 = x * x * x * x * x;
        return f0 + (1.0 - f0) * x5;
    }
    fn iriSchlickV(f0: vec3<f32>, cosTheta: f32) -> vec3<f32> {
        let x = clamp(1.0 - cosTheta, 0.0, 1.0);
        let x5 = x * x * x * x * x;
        return f0 + (vec3<f32>(1.0) - f0) * x5;
    }

    fn iriFresnel0ToIor(f0: vec3<f32>) -> vec3<f32> {
        let s = sqrt(f0);
        return (vec3<f32>(1.0) + s) / (vec3<f32>(1.0) - s);
    }
    fn iriIorToFresnel0V(transmittedIor: vec3<f32>, incidentIor: f32) -> vec3<f32> {
        return iriPow2v((transmittedIor - vec3<f32>(incidentIor)) / (transmittedIor + vec3<f32>(incidentIor)));
    }
    fn iriIorToFresnel0(transmittedIor: f32, incidentIor: f32) -> f32 {
        return iriPow2((transmittedIor - incidentIor) / (transmittedIor + incidentIor));
    }

    // Spectral sensitivity of the CIE XYZ matching functions under a phase shift, in Rec.709.
    fn iriEvalSensitivity(OPD: f32, shift: vec3<f32>) -> vec3<f32> {
        let TWO_PI = 6.28318530718;
        let phase = TWO_PI * OPD * 1.0e-9;
        let val = vec3<f32>(5.4856e-13, 4.4201e-13, 5.2481e-13);
        let pos = vec3<f32>(1.6810e+06, 1.7953e+06, 2.2084e+06);
        let vr = vec3<f32>(4.3278e+09, 9.3046e+09, 6.6121e+09);
        var xyz = val * sqrt(TWO_PI * vr) * cos(pos * phase + shift) * exp(-iriPow2(phase) * vr);
        xyz.x = xyz.x + 9.7470e-14 * sqrt(TWO_PI * 4.5282e+09) * cos(2.2399e+06 * phase + shift.x) * exp(-4.5282e+09 * iriPow2(phase));
        xyz = xyz / 1.0685e-7;
        let XYZ_TO_REC709 = mat3x3<f32>(
            vec3<f32>(3.2404542, -0.9692660, 0.0556434),
            vec3<f32>(-1.5371385, 1.8760108, -0.2040259),
            vec3<f32>(-0.4985314, 0.0415560, 1.0572252));
        return XYZ_TO_REC709 * xyz;
    }

    /// Fresnel reflectance of base + thin film at the given view angle.
    fn evalIridescence(outsideIOR: f32, eta2: f32, cosTheta1: f32, thinFilmThickness: f32, baseF0: vec3<f32>) -> vec3<f32> {
        let PI_ = 3.14159265359;
        // Force the film IOR toward the outside IOR as the film vanishes.
        let iridescenceIOR = mix(outsideIOR, eta2, smoothstep(0.0, 0.03, thinFilmThickness));
        let sinTheta2Sq = iriPow2(outsideIOR / iridescenceIOR) * (1.0 - iriPow2(cosTheta1));
        let cosTheta2Sq = 1.0 - sinTheta2Sq;
        if (cosTheta2Sq < 0.0) {
            return vec3<f32>(1.0);              // total internal reflection
        }
        let cosTheta2 = sqrt(cosTheta2Sq);

        // First interface (outside → film)
        let R0 = iriIorToFresnel0(iridescenceIOR, outsideIOR);
        let R12 = iriSchlickF(R0, cosTheta1);
        let T121 = 1.0 - R12;
        var phi12 = 0.0;
        if (iridescenceIOR < outsideIOR) { phi12 = PI_; }
        let phi21 = PI_ - phi12;

        // Second interface (film → base)
        let baseIOR = iriFresnel0ToIor(clamp(baseF0, vec3<f32>(0.0), vec3<f32>(0.9999)));
        let R1 = iriIorToFresnel0V(baseIOR, iridescenceIOR);
        let R23 = iriSchlickV(R1, cosTheta2);
        var phi23 = vec3<f32>(0.0);
        if (baseIOR.x < iridescenceIOR) { phi23.x = PI_; }
        if (baseIOR.y < iridescenceIOR) { phi23.y = PI_; }
        if (baseIOR.z < iridescenceIOR) { phi23.z = PI_; }

        // Optical path difference and total phase shift
        let OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
        let phi = vec3<f32>(phi21) + phi23;

        // Compound terms
        let R123 = clamp(R12 * R23, vec3<f32>(1e-5), vec3<f32>(0.9999));
        let r123 = sqrt(R123);
        let Rs = iriPow2(T121) * R23 / (vec3<f32>(1.0) - R123);

        // Reflectance term for m = 0 (DC term amplitude)
        var I = vec3<f32>(R12) + Rs;
        // Reflectance terms for m = 1, 2 (pairs of diracs)
        var Cm = Rs - vec3<f32>(T121);
        Cm = Cm * r123;
        I = I + Cm * 2.0 * iriEvalSensitivity(1.0 * OPD, 1.0 * phi);
        Cm = Cm * r123;
        I = I + Cm * 2.0 * iriEvalSensitivity(2.0 * OPD, 2.0 * phi);
        return max(I, vec3<f32>(0.0));
    }

    /// F0 with the film applied: the angle-dependent film Fresnel converted
    /// back to an equivalent Schlick F0, blended in by the iridescence factor.
    fn applyIridescenceF0(baseF0: vec3<f32>, NoV: f32) -> vec3<f32> {
        let factor = clamp(materialUniform.iridescence.x, 0.0, 1.0);
        let fresnel = evalIridescence(1.0, materialUniform.iridescence.y, NoV, materialUniform.iridescence.z, baseF0);
        let x = clamp(1.0 - NoV, 0.0, 1.0);
        let x5 = clamp(x * x * x * x * x, 0.0, 0.9999);
        let filmF0 = clamp((fresnel - vec3<f32>(x5)) / (1.0 - x5), vec3<f32>(0.0), vec3<f32>(1.0));
        return mix(baseF0, filmF0, factor);
    }
  #endif
`;
