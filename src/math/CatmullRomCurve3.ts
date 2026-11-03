import { Vector3 } from './Vector3';

/** Parameterization of a Catmull-Rom spline. */
export type CatmullRomType = 'centripetal' | 'chordal' | 'catmullrom';

/**
 * Smooth 3D spline that passes THROUGH every control point (unlike a Bezier
 * path, whose inner handles are off-curve). API and math follow three.js
 * `CatmullRomCurve3`:
 *
 * - `getPoint(t)` — position at curve parameter t ∈ [0,1] (uneven speed).
 * - `getPointAt(u)` — position at arc-length fraction u ∈ [0,1] (constant
 *   speed; this is what camera paths and followers want).
 * - `getTangent(t)` / `getTangentAt(u)` — unit direction of travel.
 * - `getLength()`, `getPoints(n)`, `getSpacedPoints(n)`.
 *
 * `'centripetal'` (default) never forms cusps or self-intersections inside a
 * segment; `'chordal'` is looser; `'catmullrom'` is the classic uniform
 * spline with a `tension` knob (0 = loose … 1 = straight segments).
 * @group Math
 */
export class CatmullRomCurve3 {
    public points: Vector3[];
    public closed: boolean;
    public curveType: CatmullRomType;
    public tension: number;
    /** Number of samples used for the arc-length table. */
    public arcLengthDivisions: number = 200;

    private _lengths: number[] | null = null;
    private _lengthsKey: string = '';

    constructor(points: Vector3[] = [], closed: boolean = false, curveType: CatmullRomType = 'centripetal', tension: number = 0.5) {
        this.points = points;
        this.closed = closed;
        this.curveType = curveType;
        this.tension = tension;
    }

    /** Position at curve parameter `t` ∈ [0,1]. */
    public getPoint(t: number, out: Vector3 = new Vector3()): Vector3 {
        const points = this.points;
        const l = points.length;
        if (l === 0) return out.set(0, 0, 0);
        if (l === 1) return out.copy(points[0]);

        const p = (l - (this.closed ? 0 : 1)) * t;
        let intPoint = Math.floor(p);
        let weight = p - intPoint;

        if (this.closed) {
            intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;
        } else if (weight === 0 && intPoint === l - 1) {
            intPoint = l - 2;
            weight = 1;
        }

        let p0: Vector3, p3: Vector3;
        const tmp = CatmullRomCurve3._tmp;
        if (this.closed || intPoint > 0) {
            p0 = points[(intPoint - 1) % l];
        } else {
            // Extrapolate a phantom point before the first one.
            p0 = tmp.set(points[0].x * 2 - points[1].x, points[0].y * 2 - points[1].y, points[0].z * 2 - points[1].z);
        }
        const p1 = points[intPoint % l];
        const p2 = points[(intPoint + 1) % l];
        if (this.closed || intPoint + 2 < l) {
            p3 = points[(intPoint + 2) % l];
        } else {
            const tmp2 = CatmullRomCurve3._tmp2;
            p3 = tmp2.set(points[l - 1].x * 2 - points[l - 2].x, points[l - 1].y * 2 - points[l - 2].y, points[l - 1].z * 2 - points[l - 2].z);
        }

        const px = CatmullRomCurve3._px, py = CatmullRomCurve3._py, pz = CatmullRomCurve3._pz;
        if (this.curveType === 'centripetal' || this.curveType === 'chordal') {
            const pow = this.curveType === 'chordal' ? 0.5 : 0.25;
            let dt0 = Math.pow(CatmullRomCurve3._distSq(p0, p1), pow);
            let dt1 = Math.pow(CatmullRomCurve3._distSq(p1, p2), pow);
            let dt2 = Math.pow(CatmullRomCurve3._distSq(p2, p3), pow);
            // Guard against repeated control points.
            if (dt1 < 1e-4) dt1 = 1.0;
            if (dt0 < 1e-4) dt0 = dt1;
            if (dt2 < 1e-4) dt2 = dt1;
            px.initNonuniform(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2);
            py.initNonuniform(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2);
            pz.initNonuniform(p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2);
        } else {
            px.initCatmullRom(p0.x, p1.x, p2.x, p3.x, this.tension);
            py.initCatmullRom(p0.y, p1.y, p2.y, p3.y, this.tension);
            pz.initCatmullRom(p0.z, p1.z, p2.z, p3.z, this.tension);
        }
        return out.set(px.calc(weight), py.calc(weight), pz.calc(weight));
    }

    /** Position at arc-length fraction `u` ∈ [0,1] (constant speed along the curve). */
    public getPointAt(u: number, out: Vector3 = new Vector3()): Vector3 {
        return this.getPoint(this.getUtoTmapping(u), out);
    }

    /** `divisions + 1` points at equal steps of the curve parameter. */
    public getPoints(divisions: number = 5): Vector3[] {
        const pts: Vector3[] = [];
        for (let d = 0; d <= divisions; d++) pts.push(this.getPoint(d / divisions));
        return pts;
    }

    /** `divisions + 1` points at equal arc-length steps. */
    public getSpacedPoints(divisions: number = 5): Vector3[] {
        const pts: Vector3[] = [];
        for (let d = 0; d <= divisions; d++) pts.push(this.getPointAt(d / divisions));
        return pts;
    }

    /** Total arc length (approximated with `arcLengthDivisions` chords). */
    public getLength(): number {
        const lengths = this.getLengths();
        return lengths[lengths.length - 1];
    }

    /** Cumulative chord lengths at `divisions + 1` evenly spaced parameters. Cached until the curve changes. */
    public getLengths(divisions: number = this.arcLengthDivisions): number[] {
        const key = this._cacheKey(divisions);
        if (this._lengths && this._lengthsKey === key) return this._lengths;
        const cache: number[] = [0];
        const last = this.getPoint(0), cur = new Vector3();
        let sum = 0;
        for (let p = 1; p <= divisions; p++) {
            this.getPoint(p / divisions, cur);
            sum += Math.sqrt(CatmullRomCurve3._distSq(cur, last));
            cache.push(sum);
            last.copy(cur);
        }
        this._lengths = cache;
        this._lengthsKey = key;
        return cache;
    }

    /** Force the arc-length table to be rebuilt (call after mutating a control point in place). */
    public updateArcLengths(): void {
        this._lengths = null;
    }

    /** Map an arc-length fraction `u` to the curve parameter `t`. */
    public getUtoTmapping(u: number, distance?: number): number {
        const arcLengths = this.getLengths();
        const il = arcLengths.length;
        const target = distance !== undefined ? distance : u * arcLengths[il - 1];

        // Binary search for the largest index whose length is ≤ target.
        let low = 0, high = il - 1;
        while (low <= high) {
            const i = Math.floor(low + (high - low) / 2);
            const comparison = arcLengths[i] - target;
            if (comparison < 0) low = i + 1;
            else if (comparison > 0) high = i - 1;
            else { high = i; break; }
        }
        const i = Math.max(high, 0);
        if (arcLengths[i] === target) return i / (il - 1);
        const before = arcLengths[i], after = arcLengths[Math.min(i + 1, il - 1)];
        const segment = after - before;
        const frac = segment > 0 ? (target - before) / segment : 0;
        return (i + frac) / (il - 1);
    }

    /** Unit tangent at curve parameter `t`. */
    public getTangent(t: number, out: Vector3 = new Vector3()): Vector3 {
        const delta = 0.0001;
        const t1 = Math.max(0, t - delta), t2 = Math.min(1, t + delta);
        const a = this.getPoint(t1, CatmullRomCurve3._ta), b = this.getPoint(t2, CatmullRomCurve3._tb);
        out.set(b.x - a.x, b.y - a.y, b.z - a.z);
        const len = Math.sqrt(out.x * out.x + out.y * out.y + out.z * out.z);
        return len > 0 ? out.set(out.x / len, out.y / len, out.z / len) : out;
    }

    /** Unit tangent at arc-length fraction `u`. */
    public getTangentAt(u: number, out: Vector3 = new Vector3()): Vector3 {
        return this.getTangent(this.getUtoTmapping(u), out);
    }

    public clone(): CatmullRomCurve3 {
        return new CatmullRomCurve3(this.points.map(p => p.clone()), this.closed, this.curveType, this.tension);
    }

    private _cacheKey(divisions: number): string {
        let k = `${divisions}|${this.closed}|${this.curveType}|${this.tension}|${this.points.length}`;
        for (const p of this.points) k += `|${p.x},${p.y},${p.z}`;
        return k;
    }

    private static _distSq(a: Vector3, b: Vector3): number {
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        return dx * dx + dy * dy + dz * dz;
    }

    private static _tmp = new Vector3();
    private static _tmp2 = new Vector3();
    private static _ta = new Vector3();
    private static _tb = new Vector3();
    private static _px = CatmullRomCurve3._poly();
    private static _py = CatmullRomCurve3._poly();
    private static _pz = CatmullRomCurve3._poly();

    /** Cubic polynomial c0 + c1·t + c2·t² + c3·t³ with Hermite-style initializers. */
    private static _poly() {
        let c0 = 0, c1 = 0, c2 = 0, c3 = 0;
        const init = (x0: number, x1: number, t0: number, t1: number) => {
            c0 = x0;
            c1 = t0;
            c2 = -3 * x0 + 3 * x1 - 2 * t0 - t1;
            c3 = 2 * x0 - 2 * x1 + t0 + t1;
        };
        return {
            initCatmullRom(x0: number, x1: number, x2: number, x3: number, tension: number) {
                init(x1, x2, tension * (x2 - x0), tension * (x3 - x1));
            },
            initNonuniform(x0: number, x1: number, x2: number, x3: number, dt0: number, dt1: number, dt2: number) {
                let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
                let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
                t1 *= dt1;
                t2 *= dt1;
                init(x1, x2, t1, t2);
            },
            calc(t: number) {
                const t2 = t * t, t3 = t2 * t;
                return c0 + c1 * t + c2 * t2 + c3 * t3;
            },
        };
    }
}
