import { test, expect, end } from '../util'
import { CatmullRomCurve3, CatmullRomType, Vector3 } from '@orillusion/core';

const pts = () => [new Vector3(0, 0, 0), new Vector3(10, 4, 0), new Vector3(12, 0, 8), new Vector3(30, -3, 9), new Vector3(31, 6, -5)];
const dist = (a: Vector3, b: Vector3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

await test('passes through every control point (all three parameterizations, open and closed)', async () => {
    for (const type of ['centripetal', 'chordal', 'catmullrom'] as CatmullRomType[]) {
        const p = pts();
        const open = new CatmullRomCurve3(p, false, type);
        for (let i = 0; i < p.length; i++) {
            const q = open.getPoint(i / (p.length - 1));
            if (dist(q, p[i]) > 1e-9) throw new Error(`${type} open misses control point ${i}`);
        }
        const closed = new CatmullRomCurve3(p, true, type);
        for (let i = 0; i < p.length; i++) {
            const q = closed.getPoint(i / p.length);
            if (dist(q, p[i]) > 1e-9) throw new Error(`${type} closed misses control point ${i}`);
        }
        expect(dist(closed.getPoint(1), p[0]) < 1e-9).tobe(true);      // loop closes
    }
})

await test('collinear evenly spaced points give a straight line of the right length', async () => {
    const c = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(2, 0, 0), new Vector3(3, 0, 0)]);
    expect(c.getLength()).toSubequal(3, 1e-6);
    const mid = c.getPointAt(0.5);
    expect(mid.x).toSubequal(1.5, 1e-6); expect(Math.abs(mid.y) + Math.abs(mid.z) < 1e-9).tobe(true);
    const t = c.getTangentAt(0.3);
    expect(t.x).toSubequal(1, 1e-6); expect(Math.hypot(t.x, t.y, t.z)).toSubequal(1, 1e-9);
})

await test('getSpacedPoints is uniform in arc length; getPoints is not', async () => {
    const c = new CatmullRomCurve3(pts());
    c.arcLengthDivisions = 2000;
    const spread = (list: Vector3[]) => {
        const d: number[] = [];
        for (let i = 1; i < list.length; i++) d.push(dist(list[i], list[i - 1]));
        return (Math.max(...d) - Math.min(...d)) / (d.reduce((a, b) => a + b, 0) / d.length);
    };
    const spaced = spread(c.getSpacedPoints(40)), param = spread(c.getPoints(40));
    console.log(`[CatmullRom] chord spread: spaced ${spaced.toFixed(4)}, parametric ${param.toFixed(4)}`);
    expect(spaced < 0.05).tobe(true);
    expect(param > 0.5).tobe(true);                                     // control points are unevenly spaced on purpose
    expect(c.getSpacedPoints(40).length).tobe(41);
    // u ↔ t mapping is monotonic and pinned at the ends.
    expect(c.getUtoTmapping(0)).tobe(0); expect(c.getUtoTmapping(1)).toSubequal(1, 1e-12);
    let prev = -1;
    for (let i = 0; i <= 50; i++) { const t = c.getUtoTmapping(i / 50); if (t < prev) throw new Error('mapping not monotonic'); prev = t; }
})

await test('length: closed > open, cache follows in-place edits, tangents are unit length', async () => {
    const p = pts();
    const open = new CatmullRomCurve3(p), closed = new CatmullRomCurve3(p, true);
    const lo = open.getLength();
    expect(closed.getLength() > lo).tobe(true);
    expect(lo > dist(p[0], p[4])).tobe(true);                           // longer than the straight chord
    expect(open.getLengths() === open.getLengths()).tobe(true);         // cached
    p[2].y += 25;                                                        // mutate a control point in place
    expect(open.getLength() > lo + 5).tobe(true);                       // table rebuilt without an explicit call
    for (let i = 0; i <= 10; i++) {
        const t = open.getTangent(i / 10);
        expect(Math.hypot(t.x, t.y, t.z)).toSubequal(1, 1e-6);
    }
})

await test('tension (uniform type), degenerate inputs, clone', async () => {
    const p = [new Vector3(0, 0, 0), new Vector3(5, 5, 0), new Vector3(10, 0, 0)];
    const loose = new CatmullRomCurve3(p, false, 'catmullrom', 0.5), tight = new CatmullRomCurve3(p, false, 'catmullrom', 0);
    // Tension 0 = zero tangents: the quarter point sits on the chord p0→p1 (0.5 on the cubic ease), not bulging past it.
    const q = tight.getPoint(0.25);
    expect(q.x).toSubequal(2.5, 1e-9); expect(q.y).toSubequal(2.5, 1e-9);
    expect(loose.getLength() > tight.getLength()).tobe(true);
    expect(new CatmullRomCurve3([]).getPoint(0.5).x).tobe(0);
    const one = new CatmullRomCurve3([new Vector3(7, 8, 9)]).getPoint(0.3);
    expect(one.x === 7 && one.y === 8 && one.z === 9).tobe(true);
    // Repeated control points must not produce NaN.
    const dup = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(1, 0, 0)]);
    for (let i = 0; i <= 10; i++) { const d = dup.getPoint(i / 10); if (!isFinite(d.x + d.y + d.z)) throw new Error('NaN on repeated points'); }
    const c = loose.clone();
    expect(c.points[1] !== loose.points[1] && c.points[1].y === 5 && c.curveType === 'catmullrom').tobe(true);
})

setTimeout(end, 500)
