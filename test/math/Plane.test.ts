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

await test('Plane intersectsRay parallel', async () => {
    let plane = new Plane(Vector3.ZERO, Vector3.UP);

    // horizontal rays never reach the plane, whichever side they start on
    let above = new Ray(new Vector3(0, 5, 0), new Vector3(1, 0, 0));
    let below = new Ray(new Vector3(0, -5, 0), new Vector3(1, 0, 0));
    let inside = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));

    expect(plane.intersectsRay(above, new Vector3())).toEqual(false);
    expect(plane.intersectsRay(below, new Vector3())).toEqual(false);
    expect(plane.intersectsRay(inside, new Vector3())).toEqual(false);
})

setTimeout(end, 500)
