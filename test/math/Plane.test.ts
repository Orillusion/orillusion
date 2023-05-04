import { test, expect, end, delay } from '../util'
import { Engine3D, Plane, Ray, Vector3 } from '@orillusion/core';

await test('Plane intersectsLine', async () => {
    let plane = new Plane(Vector3.ZERO, Vector3.X_AXIS);

    let intersection = new Vector3();
    let result = plane.intersectsLine(new Vector3(-10, 0, 0), new Vector3(10, 0, 0), intersection);

    expect(result).toEqual(true);
    expect(intersection.x).toSubequal(0);
    expect(intersection.y).toSubequal(0);
    expect(intersection.z).toSubequal(0);
})

await test('Plane intersectsRay', async () => {
    let plane = new Plane(Vector3.ZERO, Vector3.X_AXIS);

    let ray = new Ray(new Vector3(-10, 0, 0), new Vector3(1, 0, 0));

    let intersection = new Vector3();
    let result = plane.intersectsRay(ray, intersection);

    expect(result).toEqual(true);
    expect(intersection.x).toSubequal(0);
    expect(intersection.y).toSubequal(0);
    expect(intersection.z).toSubequal(0);
})

setTimeout(end, 500)
