/**
 * CPU mirror of `Iridescence_frag` (thin-film interference, Belcour & Barla
 * 2017). Keep in sync with the WGSL. Useful for previews, LUT baking and
 * GPU-vs-CPU validation.
 * @group Util
 */
export class IridescenceUtil {
    private static _schlick(f0: number, cosTheta: number): number {
        const x = Math.min(Math.max(1 - cosTheta, 0), 1);
        return f0 + (1 - f0) * x * x * x * x * x;
    }

    private static _sensitivity(OPD: number, shift: number[]): number[] {
        const TWO_PI = 6.28318530718;
        const phase = TWO_PI * OPD * 1.0e-9;
        const val = [5.4856e-13, 4.4201e-13, 5.2481e-13];
        const pos = [1.6810e+06, 1.7953e+06, 2.2084e+06];
        const vr = [4.3278e+09, 9.3046e+09, 6.6121e+09];
        const xyz = [0, 1, 2].map(i => val[i] * Math.sqrt(TWO_PI * vr[i]) * Math.cos(pos[i] * phase + shift[i]) * Math.exp(-phase * phase * vr[i]));
        xyz[0] += 9.7470e-14 * Math.sqrt(TWO_PI * 4.5282e+09) * Math.cos(2.2399e+06 * phase + shift[0]) * Math.exp(-4.5282e+09 * phase * phase);
        for (let i = 0; i < 3; i++) xyz[i] /= 1.0685e-7;
        // Column-major XYZ → Rec.709
        const m = [3.2404542, -0.9692660, 0.0556434, -1.5371385, 1.8760108, -0.2040259, -0.4985314, 0.0415560, 1.0572252];
        return [
            m[0] * xyz[0] + m[3] * xyz[1] + m[6] * xyz[2],
            m[1] * xyz[0] + m[4] * xyz[1] + m[7] * xyz[2],
            m[2] * xyz[0] + m[5] * xyz[1] + m[8] * xyz[2],
        ];
    }

    /**
     * Fresnel reflectance (linear RGB) of a base surface with Schlick F0
     * `baseF0` under a thin film of index `filmIor` and thickness
     * `thicknessNm`, seen at `cosTheta` (N·V).
     */
    public static evalIridescence(outsideIOR: number, filmIor: number, cosTheta: number, thicknessNm: number, baseF0: [number, number, number]): [number, number, number] {
        const smooth = (() => { const t = Math.min(Math.max(thicknessNm / 0.03, 0), 1); return t * t * (3 - 2 * t); })();
        const iridescenceIOR = outsideIOR + (filmIor - outsideIOR) * smooth;
        const sinTheta2Sq = Math.pow(outsideIOR / iridescenceIOR, 2) * (1 - cosTheta * cosTheta);
        const cosTheta2Sq = 1 - sinTheta2Sq;
        if (cosTheta2Sq < 0) return [1, 1, 1];
        const cosTheta2 = Math.sqrt(cosTheta2Sq);

        const R0 = Math.pow((iridescenceIOR - outsideIOR) / (iridescenceIOR + outsideIOR), 2);
        const R12 = IridescenceUtil._schlick(R0, cosTheta);
        const T121 = 1 - R12;
        const phi12 = iridescenceIOR < outsideIOR ? Math.PI : 0;
        const phi21 = Math.PI - phi12;

        const out: number[] = [0, 0, 0];
        const R23: number[] = [], phi: number[] = [], R123: number[] = [], r123: number[] = [], Rs: number[] = [];
        for (let i = 0; i < 3; i++) {
            const f0 = Math.min(Math.max(baseF0[i], 0), 0.9999);
            const s = Math.sqrt(f0);
            const baseIOR = (1 + s) / (1 - s);
            const R1 = Math.pow((baseIOR - iridescenceIOR) / (baseIOR + iridescenceIOR), 2);
            R23[i] = IridescenceUtil._schlick(R1, cosTheta2);
            phi[i] = phi21 + (baseIOR < iridescenceIOR ? Math.PI : 0);
            R123[i] = Math.min(Math.max(R12 * R23[i], 1e-5), 0.9999);
            r123[i] = Math.sqrt(R123[i]);
            Rs[i] = (T121 * T121 * R23[i]) / (1 - R123[i]);
            out[i] = R12 + Rs[i];
        }
        const OPD = 2 * iridescenceIOR * thicknessNm * cosTheta2;
        const Cm = [0, 1, 2].map(i => Rs[i] - T121);
        for (let m = 1; m <= 2; m++) {
            for (let i = 0; i < 3; i++) Cm[i] *= r123[i];
            const Sm = IridescenceUtil._sensitivity(m * OPD, phi.map(p => m * p));
            for (let i = 0; i < 3; i++) out[i] += Cm[i] * 2 * Sm[i];
        }
        return [Math.max(out[0], 0), Math.max(out[1], 0), Math.max(out[2], 0)];
    }

    /**
     * The F0 the PBR shader ends up using: film Fresnel converted back to a
     * Schlick F0 and blended with the base F0 by `factor`.
     */
    public static filmF0(baseF0: [number, number, number], NoV: number, factor: number, filmIor: number, thicknessNm: number): [number, number, number] {
        const fresnel = IridescenceUtil.evalIridescence(1.0, filmIor, NoV, thicknessNm, baseF0);
        const x = Math.min(Math.max(1 - NoV, 0), 1);
        const x5 = Math.min(Math.max(x * x * x * x * x, 0), 0.9999);
        const f = Math.min(Math.max(factor, 0), 1);
        return [0, 1, 2].map(i => {
            const film = Math.min(Math.max((fresnel[i] - x5) / (1 - x5), 0), 1);
            return baseF0[i] + (film - baseF0[i]) * f;
        }) as [number, number, number];
    }
}
