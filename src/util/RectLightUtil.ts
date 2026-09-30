type V3 = number[];

/** Geometry and radiometry of a rect light, as plain numbers. */
export interface RectLightDesc {
    /** Panel centre. */
    center: V3;
    /** Unit normal of the emitting face. */
    normal: V3;
    /** Panel up axis (need not be exactly perpendicular to `normal`). */
    up: V3;
    width: number;
    height: number;
    /** Linear RGB colour. */
    color: V3;
    intensity: number;
    range: number;
}

/**
 * CPU mirror of `RectLight_frag`: analytic rectangular area light.
 * @group Util
 */
export class RectLightUtil {
    private static dot(a: V3, b: V3) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    private static cross(a: V3, b: V3): V3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    private static len(a: V3) { return Math.hypot(a[0], a[1], a[2]); }
    private static norm(a: V3): V3 { const l = RectLightUtil.len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
    private static add(a: V3, b: V3, s = 1): V3 { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
    private static clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }

    /** Orthonormal frame of the panel: `right`, `up`, `normal`. */
    public static frame(light: RectLightDesc): { right: V3; up: V3; normal: V3 } {
        const U = RectLightUtil;
        const normal = U.norm(light.normal);
        const up = U.norm(U.add(light.up, normal, -U.dot(light.up, normal)));
        return { right: U.cross(up, normal), up, normal };
    }

    /** The four corners in world space. */
    public static corners(light: RectLightDesc): V3[] {
        const U = RectLightUtil;
        const f = U.frame(light);
        const hw = light.width * 0.5, hh = light.height * 0.5;
        const c = light.center;
        return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => U.add(U.add(c, f.right, sx * hw), f.up, sy * hh));
    }

    /**
     * Unclipped vector form factor of the panel seen from `P` (Lambert's
     * polygon formula). Its length is the form factor toward the panel, its
     * direction the mean incoming light direction.
     */
    public static formFactorVector(P: V3, light: RectLightDesc): V3 {
        const U = RectLightUtil;
        const v = U.corners(light).map((q) => U.norm(U.add(q, P, -1)));
        let sum: V3 = [0, 0, 0];
        for (let i = 0; i < 4; i++) {
            const a = v[i], b = v[(i + 1) % 4];
            const c = U.cross(a, b);
            const s = U.len(c);
            const theta = Math.acos(U.clamp(U.dot(a, b), -1, 1));
            sum = U.add(sum, c, s < 1e-5 ? 1 : theta / s);
        }
        let F: V3 = [sum[0] / (2 * Math.PI), sum[1] / (2 * Math.PI), sum[2] / (2 * Math.PI)];
        if (U.dot(F, U.add(light.center, P, -1)) < 0) F = [-F[0], -F[1], -F[2]];
        return F;
    }

    /** Horizon-clipped form factor of a sphere with sin²σ = `sinSigmaSqr` at angle θ from the normal. */
    public static sphereFormFactor(cosTheta: number, sinSigmaSqr: number): number {
        const s2 = RectLightUtil.clamp(sinSigmaSqr, 1e-7, 0.9999);
        if (cosTheta * cosTheta > s2) return s2 * RectLightUtil.clamp(cosTheta, 0, 1);
        const sinTheta = Math.sqrt(Math.max(1 - cosTheta * cosTheta, 1e-7));
        const x = Math.sqrt(1 / s2 - 1);
        const y = RectLightUtil.clamp(-x * (cosTheta / sinTheta), -1, 1);
        const sty = sinTheta * Math.sqrt(Math.max(1 - y * y, 0));
        const illum = (cosTheta * Math.acos(y) - x * sty) * s2 + Math.atan(sty / x);
        return Math.max(illum, 0) / Math.PI;
    }

    /** Distance window: 1 at the panel, 0 at `range`. */
    public static falloff(distance: number, range: number): number {
        const w = distance / Math.max(range, 1e-4);
        const f = RectLightUtil.clamp(1 - w * w * w * w, 0, 1);
        return f * f;
    }

    /**
     * Form factor (0..1) of the panel for a surface point `P` with normal `N`:
     * irradiance = π · radiance · formFactor. Zero behind the emitting face.
     */
    public static formFactor(P: V3, N: V3, light: RectLightDesc): number {
        const U = RectLightUtil;
        if (U.dot(U.add(P, light.center, -1), U.norm(light.normal)) <= 1e-5) return 0;
        const F = U.formFactorVector(P, light);
        const len = U.len(F);
        if (len < 1e-7) return 0;
        return U.sphereFormFactor(U.dot(N, F) / len, len);
    }

    /** Point of the panel that stands in for the whole light in the specular term. */
    public static representativePoint(P: V3, N: V3, V: V3, light: RectLightDesc): V3 {
        const U = RectLightUtil;
        const f = U.frame(light);
        const c = U.add(light.center, P, -1);
        const d2 = 2 * U.dot(V, N);
        const R: V3 = [d2 * N[0] - V[0], d2 * N[1] - V[1], d2 * N[2] - V[2]];
        const denom = U.dot(R, f.normal);
        let hit = U.add(P, R, U.len(c));
        if (denom < -1e-4) hit = U.add(P, R, U.dot(c, f.normal) / denom);
        hit = U.add(hit, f.normal, -U.dot(U.add(hit, light.center, -1), f.normal));
        const d = U.add(hit, light.center, -1);
        const hw = light.width * 0.5, hh = light.height * 0.5;
        return U.add(U.add(light.center, f.right, U.clamp(U.dot(d, f.right), -hw, hw)), f.up, U.clamp(U.dot(d, f.up), -hh, hh));
    }

    /**
     * Outgoing radiance toward `V` from a surface lit by the panel.
     * `roughness` is the shader-side value (`fragData.Roughness`).
     */
    public static shade(P: V3, N: V3, V: V3, albedo: V3, metallic: number, roughness: number, F0: V3, light: RectLightDesc): V3 {
        const U = RectLightUtil;
        const n = U.norm(light.normal);
        const toP = U.add(P, light.center, -1);
        if (U.dot(toP, n) <= 1e-5) return [0, 0, 0];
        const fall = U.falloff(U.len(toP), light.range);
        if (fall <= 0) return [0, 0, 0];
        const Fv = U.formFactorVector(P, light);
        const len = U.len(Fv);
        if (len < 1e-7) return [0, 0, 0];
        const ff = U.sphereFormFactor(U.dot(N, Fv) / len, len);
        const rad = light.color.map((ch) => ch * Math.max(light.intensity, 0) * fall);
        const NdotV = Math.max(U.dot(N, V), 0.05);
        const fresnel = (x: number) => { const f = Math.pow(2, (-5.55473 * x - 6.98316) * x); return F0.map((f0) => f + (1 - f) * f0); };
        const Fd = fresnel(NdotV);
        const out = [0, 1, 2].map((i) => (1 - Fd[i]) * (1 - metallic) * albedo[i] * rad[i] * ff);

        const mrp = U.representativePoint(P, N, V, light);
        const toL = U.add(mrp, P, -1);
        const distL = Math.max(U.len(toL), 1e-4);
        const L: V3 = [toL[0] / distL, toL[1] / distL, toL[2] / distL];
        const NdotL = U.dot(N, L);
        if (NdotL > 0) {
            const H = U.norm(U.add(V, L));
            const NdotH = U.clamp(U.dot(N, H), 0, 1);
            const HdotL = U.clamp(U.dot(H, L), 0, 1);
            const rough = U.clamp(roughness, 0.045, 1);
            const alpha = rough * rough;
            const sourceRadius = Math.sqrt((light.width * light.height) / Math.PI);
            const alphaPrime = U.clamp(alpha + sourceRadius / (2 * distL), 0, 1);
            const a2 = alpha * alpha;
            const den = NdotH * NdotH * (a2 - 1) + 1;
            const D = (a2 / (Math.PI * den * den)) * (a2 / (alphaPrime * alphaPrime));
            const K = ((1 + rough) * (1 + rough)) / 8;
            const gsub = (x: number) => x / (x + (1 - x) * K);
            const G = gsub(NdotL) * gsub(NdotV);
            const Fs = fresnel(HdotL);
            for (let i = 0; i < 3; i++) out[i] += (rad[i] * Math.PI * len * D * G * Fs[i]) / (4 * NdotV);
        }
        return out;
    }
}
