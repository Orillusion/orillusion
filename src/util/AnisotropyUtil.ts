/**
 * CPU mirror of `Anisotropy_frag` (the anisotropic / isotropic GGX ratio).
 * All vectors are unit length, in the same space; `T`, `B`, `N` form an
 * orthonormal frame with `T` along the grain direction.
 * @group Util
 */
export class AnisotropyUtil {
    private static _dot(a: number[], b: number[]) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    private static _norm(a: number[]) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

    /** Tangent-direction alpha for a roughness and anisotropy strength (glTF: mix(α, 1, strength²)). */
    public static alphaT(roughness: number, strength: number): number {
        const a = Math.max(roughness * roughness, 0.002);
        const s = Math.min(Math.max(strength, 0), 1);
        return a + (1 - a) * s * s;
    }

    /** (anisotropic D·V) / (isotropic D·V). Exactly 1 for strength 0. */
    public static specularRatio(N: number[], V: number[], L: number[], T: number[], B: number[], roughness: number, strength: number): number {
        const d = AnisotropyUtil._dot;
        const H = AnisotropyUtil._norm([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
        const NoH = Math.min(Math.max(d(N, H), 0), 1);
        const NoL = Math.min(Math.max(d(N, L), 0.0001), 1);
        const NoV = Math.min(Math.max(d(N, V), 0.0001), 1);
        const a = Math.max(roughness * roughness, 0.002);
        const at = AnisotropyUtil.alphaT(roughness, strength), ab = a;
        const ToH = d(T, H), BoH = d(B, H), ToV = d(T, V), BoV = d(B, V), ToL = d(T, L), BoL = d(B, L);
        const a2 = a * a;
        const dIsoDen = NoH * NoH * (a2 - 1) + 1;
        const dIso = a2 / (dIsoDen * dIsoDen);
        const dAniDen = (ToH * ToH) / (at * at) + (BoH * BoH) / (ab * ab) + NoH * NoH;
        const dAni = 1 / (at * ab * dAniDen * dAniDen);
        const vIso = 0.5 / (NoL * Math.sqrt(NoV * NoV * (1 - a2) + a2) + NoV * Math.sqrt(NoL * NoL * (1 - a2) + a2));
        const vAni = 0.5 / (NoL * Math.hypot(at * ToV, ab * BoV, NoV) + NoV * Math.hypot(at * ToL, ab * BoL, NoL));
        return (dAni * vAni) / Math.max(dIso * vIso, 1e-8);
    }
}
