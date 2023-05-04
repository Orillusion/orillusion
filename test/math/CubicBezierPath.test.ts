import { CubicBezierPath } from '../../src/math/CubicBezierPath';
import { test, expect, end, delay } from '../util'
import { Vector3 } from '@orillusion/core';

await test('CubicBezierPath test', async () => {
    let cubicBezierPath = new CubicBezierPath([
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 0, -1),
        new Vector3(1, 1, 0),
        new Vector3(0, -2, 0),
        new Vector3(0, 0, 3),
        new Vector3(1, -4, 0),
        new Vector3(-10, -9, 0),
        new Vector3(-1, -9, 0),
    ]);

    let v1 = cubicBezierPath.getPoint(0.1);
    let v2 = cubicBezierPath.getPoint(0.6);
    let v3 = cubicBezierPath.getPoint(0.9);

    expect(v1.x).toEqual(0.24300000000000008);
    expect(v1.y).toEqual(0.027000000000000007);
    expect(v1.z).toEqual(-0.0010000000000000002);

    expect(v2.x).toEqual(0.288);
    expect(v2.y).toEqual(0.43199999999999994);
    expect(v2.z).toEqual(-0.216);

    expect(v3.x).toEqual(0.02699999999999999);
    expect(v3.y).toEqual(0.24299999999999997);
    expect(v3.z).toEqual(-0.7290000000000001);
})

setTimeout(end, 500)
