/**
 * Rectangular area light, evaluated analytically (no lookup textures).
 *
 * - Diffuse: Lambert's polygon formula gives the exact vector form factor of
 *   the quad; the part below the surface horizon is handled by replacing the
 *   quad with a sphere of the same form factor and clipping that analytically.
 * - Specular: most-representative-point — the point of the rectangle closest
 *   to the reflection ray stands in for the whole light, with the GGX lobe
 *   re-normalised for the light's angular size.
 *
 * `LightData` packing for this type: `position` = centre, `direction` = the
 * emitting face normal, `lightTangent` = the rectangle's up axis,
 * `innerCutOff` / `outerCutOff` = half width / half height, `range` = the
 * distance at which the contribution is windowed to zero.
 * CPU mirror: `RectLightUtil`.
 * @internal
 */
export let RectLight_frag: string = /*wgsl*/ `
    fn rectEdgeTerm(a: vec3<f32>, b: vec3<f32>) -> vec3<f32> {
        let c = cross(a, b);
        let s = length(c);
        let theta = acos(clamp(dot(a, b), -1.0, 1.0));
        if (s < 1e-5) {
            return c;
        }
        return c * (theta / s);
    }

    /// Unclipped vector form factor of the quad p0..p3 seen from the origin.
    fn rectFormFactorVector(p0: vec3<f32>, p1: vec3<f32>, p2: vec3<f32>, p3: vec3<f32>) -> vec3<f32> {
        let v0 = normalize(p0);
        let v1 = normalize(p1);
        let v2 = normalize(p2);
        let v3 = normalize(p3);
        let sum = rectEdgeTerm(v0, v1) + rectEdgeTerm(v1, v2) + rectEdgeTerm(v2, v3) + rectEdgeTerm(v3, v0);
        return sum * (0.5 / 3.14159265359);
    }

    /// Form factor of a sphere subtending sin^2(sigma) = sinSigmaSqr whose centre
    /// is at angle theta from the normal, clipped by the horizon.
    fn rectSphereFormFactor(cosTheta: f32, sinSigmaSqrIn: f32) -> f32 {
        let sinSigmaSqr = clamp(sinSigmaSqrIn, 1e-7, 0.9999);
        if (cosTheta * cosTheta > sinSigmaSqr) {
            return sinSigmaSqr * saturate(cosTheta);
        }
        let sinTheta = sqrt(max(1.0 - cosTheta * cosTheta, 1e-7));
        let x = sqrt(1.0 / sinSigmaSqr - 1.0);
        let y = clamp(-x * (cosTheta / sinTheta), -1.0, 1.0);
        let sinThetaSqrtY = sinTheta * sqrt(max(1.0 - y * y, 0.0));
        let illum = (cosTheta * acos(y) - x * sinThetaSqrtY) * sinSigmaSqr + atan(sinThetaSqrtY / x);
        return max(illum, 0.0) / 3.14159265359;
    }

    fn rectLighting(WP: vec3<f32>, light: LightData) -> vec3<f32> {
        let C = light.position.xyz;
        let n = normalize(light.direction.xyz);
        let toP = WP - C;
        // Single sided: nothing behind the emitting face.
        if (dot(toP, n) <= 1e-5) {
            return vec3<f32>(0.0);
        }
        let distC = length(toP);
        let w = distC / max(light.range, 1e-4);
        let w2 = w * w;
        var falloff = saturate(1.0 - w2 * w2);
        falloff = falloff * falloff;
        if (falloff <= 0.0) {
            return vec3<f32>(0.0);
        }

        var up = light.lightTangent.xyz - n * dot(light.lightTangent.xyz, n);
        up = normalize(up);
        let right = cross(up, n);
        let hw = light.innerCutOff;
        let hh = light.outerCutOff;
        let ex = right * hw;
        let ey = up * hh;
        let c = C - WP;

        var Fv = rectFormFactorVector(c - ex - ey, c + ex - ey, c + ex + ey, c - ex + ey);
        if (dot(Fv, c) < 0.0) {
            Fv = -Fv;
        }
        let len = length(Fv);
        if (len < 1e-7) {
            return vec3<f32>(0.0);
        }
        let N = fragData.N;
        let V = fragData.V;
        let formFactor = rectSphereFormFactor(dot(N, Fv) / len, len);
        let radiance = light.lightColor.rgb * max(light.intensity, 0.0) * falloff;
        let NdotV = max(dot(N, V), 0.05);

        // ---- diffuse ----
        let KD = (vec3<f32>(1.0) - F_Function(NdotV, fragData.F0)) * (1.0 - fragData.Metallic);
        var color = KD * fragData.Albedo.rgb * radiance * formFactor;

        // ---- specular: most representative point ----
        let R = reflect(-V, N);
        let denom = dot(R, n);
        var hit = WP + R * distC;
        if (denom < -1e-4) {
            hit = WP + R * (dot(c, n) / denom);
        }
        hit = hit - n * dot(hit - C, n);
        let d = hit - C;
        let mrp = C + right * clamp(dot(d, right), -hw, hw) + up * clamp(dot(d, up), -hh, hh);
        let toL = mrp - WP;
        let distL = max(length(toL), 1e-4);
        let L = toL / distL;
        let NdotL = dot(N, L);
        if (NdotL > 0.0) {
            let H = normalize(V + L);
            let NdotH = saturate(dot(N, H));
            let HdotL = saturate(dot(H, L));
            let rough = clamp(fragData.Roughness, 0.045, 1.0);
            let alpha = rough * rough;
            let sourceRadius = sqrt(4.0 * hw * hh / 3.14159265359);
            let alphaPrime = saturate(alpha + sourceRadius / (2.0 * distL));
            let norm = (alpha * alpha) / (alphaPrime * alphaPrime);
            let D = D_Function(NdotH, rough) * norm;
            let G = G_Function(NdotL, NdotV, rough);
            let F = F_Function(HdotL, fragData.F0);
            color += radiance * (3.14159265359 * len) * D * G * F / (4.0 * NdotV);
        }
        return color;
    }
`;
