import { test, expect, end, delay } from '../util'
import { Triangle, Vector3 } from '@orillusion/core';

await test('Triangle base', async () => {
    let a = new Triangle(
        new Vector3(0, 10, 0),
        new Vector3(-5, 0, 0),
        new Vector3(5, 0, 0),
    );

    expect(a.v1.x).toEqual(0);
    expect(a.v1.y).toEqual(10);
    expect(a.v1.z).toEqual(0);

    expect(a.v2.x).toEqual(-5);
    expect(a.v2.y).toEqual(0);
    expect(a.v2.z).toEqual(0);

    expect(a.v3.x).toEqual(5);
    expect(a.v3.y).toEqual(0);
    expect(a.v3.z).toEqual(0);
})

await test('Triangle getNormal', async () => {
    let a = new Triangle(
        new Vector3(0, 10, 0),
        new Vector3(-5, 0, 0),
        new Vector3(5, 0, 0),
    );

    let result = a.getNormal();

    expect(result.x).toSubequal(0);
    expect(result.y).toSubequal(0);
    expect(result.z).toSubequal(-1);
})

await test('Triangle getCenter', async () => {
    let a = new Triangle(
        new Vector3(0, 10, 0),
        new Vector3(-5, 0, 0),
        new Vector3(5, 0, 0),
    );

    let result = a.getCenter();

    expect(result.x).toSubequal(0);
    expect(result.y).toSubequal(5);
    expect(result.z).toSubequal(0);
})

await test('Triangle intersects', async () => {
    let a = new Triangle(
        new Vector3(0, 10, 0),
        new Vector3(-5, 0, 0),
        new Vector3(5, 0, 0),
    );

    let b = new Triangle(
        new Vector3(0, 10, 0),
        new Vector3(0, 0, -5),
        new Vector3(0, 0, 5),
    );

    expect(a.intersects(b)).toEqual(true);
})

setTimeout(end, 500)
