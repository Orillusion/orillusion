import { test, expect, end, delay } from '../util'
import { Vector3 } from '@orillusion/core';

await test('Vector3 base', async () => {
    let a = new Vector3(20, 10, 0);

    expect(a.x).toEqual(20);
    expect(a.y).toEqual(10);
    expect(a.z).toEqual(0);

    let b = a.clone();
    expect(b.x).toEqual(a.x);
    expect(b.y).toEqual(a.y);
    expect(b.z).toEqual(a.z);

    a.set(0, 0, 0);
    expect(a.x).toEqual(0);
    expect(a.y).toEqual(0);
    expect(a.z).toEqual(0);
})

await test('Vector3 add', async () => {
    let a = new Vector3(20, 10, 0);
    let b = new Vector3(10, 10, 0);

    let result = a.add(b);
    expect(result.x).toEqual(30);
    expect(result.y).toEqual(20);
    expect(result.z).toEqual(0);
})

await test('Vector3 sub', async () => {
    let a = new Vector3(20, 10, 0);
    let b = new Vector3(10, 10, 0);

    let result = a.subtract(b);
    expect(result.x).toEqual(10);
    expect(result.y).toEqual(0);
    expect(result.z).toEqual(0);
})

await test('Vector3 dotProduct', async () => {
    let a = new Vector3(20, 10, 0);
    let b = new Vector3(10, 10, 0);

    let result = a.dotProduct(b);
    expect(result).toEqual(300);
})

await test('Vector3 addScalar', async () => {
    let a = new Vector3(20, 10, 0);

    let result = a.addXYZW(10, 10, 10, 0);
    expect(result.x).toEqual(30);
    expect(result.y).toEqual(20);
    expect(result.z).toEqual(10);
})

await test('Vector3 scaleBy', async () => {
    let a = new Vector3(20, 10, 0);
    a.scaleBy(10);

    expect(a.x).toEqual(200);
    expect(a.y).toEqual(100);
    expect(a.z).toEqual(0);
})

await test('Vector3 divide', async () => {
    let a = new Vector3(20, 10, 0);

    let result = a.divide(10);

    expect(result.x).toSubequal(2);
    expect(result.y).toSubequal(1);
    expect(result.z).toSubequal(0);
})

await test('Vector3 distance', async () => {
    let a = new Vector3(20, 10, 0);
    let b = new Vector3(10, 10, 0);

    let result = Vector3.distance(a, b)
    expect(result).toSubequal(10);
})

await test('Vector3 length', async () => {
    let a = new Vector3(20, 10, 0);
    let result = a.length;

    expect(result).toSubequal(22.360679774997898);
})

await test('Vector3 getAngle', async () => {
    let a = new Vector3(20, 10, 0);
    let b = new Vector3(10, 10, 0);

    let result = Vector3.getAngle(a, b);

    expect(result).toSubequal(18.43494882292201);
})

await test('Vector3 normalize', async () => {
    let a = new Vector3(20, 10, 0)
    a.normalize();

    expect(a.x).toSubequal(0.89442719099);
    expect(a.y).toSubequal(0.44721359549);
    expect(a.z).toSubequal(0);
})

setTimeout(end, 500)
