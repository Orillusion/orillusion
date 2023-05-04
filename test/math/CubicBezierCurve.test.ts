import { CubicBezierCurve } from '../../src/math/CubicBezierCurve';
import { test, expect, end, delay } from '../util'
import { Engine3D, Vector3 } from '@orillusion/core';

await test('cubicBezier getPoint test', async () => {
    let cubicBezier = new CubicBezierCurve([
        new Vector3(0.0, 0.0, 2.0),
        new Vector3(0.0, 1.0, 0.0),
        new Vector3(-1.0, 3.0, 0.0),
        new Vector3(0.0, 0.0, 1.0)
    ]);

    let tv0 = cubicBezier.getPoint(0.0);
    let tv1 = cubicBezier.getPoint(0.25);
    let tv2 = cubicBezier.getPoint(0.75);
    let tv3 = cubicBezier.getPoint(1);

    expect(tv0.x).toEqual(0);
    expect(tv0.y).toEqual(0);
    expect(tv0.z).toEqual(2);
    expect(tv0.w).toEqual(0);

    expect(tv1.x).toEqual(-0.140625);
    expect(tv1.y).toEqual(0.84375);
    expect(tv1.z).toEqual(0.859375);
    expect(tv1.w).toEqual(0);

    expect(tv2.x).toEqual(-0.421875);
    expect(tv2.y).toEqual(1.40625);
    expect(tv2.z).toEqual(0.453125);
    expect(tv2.w).toEqual(0);

    expect(tv3.x).toEqual(0);
    expect(tv3.y).toEqual(0);
    expect(tv3.z).toEqual(1);
    expect(tv3.w).toEqual(0);
})

await test('cubicBezier getTangent test', async () => {
    let cubicBezier = new CubicBezierCurve([
        new Vector3(0.0, 0.0, 2.0),
        new Vector3(0.0, 1.0, 0.0),
        new Vector3(-1.0, 3.0, 0.0),
        new Vector3(0.0, 0.0, 1.0)
    ]);

    let tt0 = cubicBezier.getTangent(0.0);
    let tt1 = cubicBezier.getTangent(0.25);
    let tt2 = cubicBezier.getTangent(0.75);
    let tt3 = cubicBezier.getTangent(1);

    expect(tt0.x).toEqual(0);
    expect(tt0.y).toEqual(1);
    expect(tt0.z).toEqual(-2);
    expect(tt0.w).toEqual(1);

    expect(tt1.x).toEqual(-0.4375);
    expect(tt1.y).toEqual(1.75);
    expect(tt1.z).toEqual(-1.8125);
    expect(tt1.w).toEqual(1);

    expect(tt2.x).toEqual(-0.9375);
    expect(tt2.y).toEqual(1.75);
    expect(tt2.z).toEqual(-0.3125);
    expect(tt2.w).toEqual(1);

    expect(tt3.x).toEqual(-1);
    expect(tt3.y).toEqual(1);
    expect(tt3.z).toEqual(1);
    expect(tt3.w).toEqual(1);
})

setTimeout(end, 500)
