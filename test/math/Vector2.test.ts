import { test, expect, end, delay } from '../util'
import { RADIANS_TO_DEGREES, Vector2 } from '@orillusion/core';

await test('Vector2 base', async () => {
    let a = new Vector2(20, 10);

    expect(a.x).toEqual(20);
    expect(a.y).toEqual(10);

    let b = a.clone();
    expect(b.x).toEqual(a.x);
    expect(b.y).toEqual(a.y);

    a.set(0, 0);
    expect(a.x).toEqual(0);
    expect(a.y).toEqual(0);
})

await test('Vector2 add', async () => {
    let a = new Vector2(20, 10);
    let b = new Vector2(10, 10);

    let result = a.add(b);
    expect(result.x).toEqual(30);
    expect(result.y).toEqual(20);
})

await test('Vector2 sub', async () => {
    let a = new Vector2(20, 10);
    let b = new Vector2(10, 10);

    let result = a.sub(b);
    expect(result.x).toEqual(10);
    expect(result.y).toEqual(0);
})

await test('Vector2 dot', async () => {
    let a = new Vector2(20, 10);
    let b = new Vector2(10, 10);

    let result = a.dot(b);
    expect(result).toEqual(300);
})

await test('Vector2 addScalar', async () => {
    let a = new Vector2(20, 10);

    let result = a.addScalar(10);
    expect(result.x).toEqual(30);
    expect(result.y).toEqual(20);
})

await test('Vector2 scale', async () => {
    let a = new Vector2(20, 10);
    a.scale(10);

    expect(a.x).toEqual(200);
    expect(a.y).toEqual(100);
})

await test('Vector2 divide', async () => {
    let a = new Vector2(20, 10);

    let result = a.divide(10);

    expect(result.x).toSubequal(2);
    expect(result.y).toSubequal(1);
})

await test('Vector2 distance', async () => {
    let a = new Vector2(20, 10);
    let b = new Vector2(10, 10);

    let result = a.distance(b);
    expect(result).toSubequal(10);
})

await test('Vector2 length', async () => {
    let a = new Vector2(20, 10);
    let result = a.length();

    expect(result).toSubequal(22.360679774997898);
})

await test('Vector2 getAngle', async () => {
    let a = new Vector2(20, 10);
    let b = new Vector2(10, 10);
    let result = a.getAngle(b);

    expect(result * RADIANS_TO_DEGREES).toSubequal(180);
})

await test('Vector2 normalize', async () => {
    let a = new Vector2(20, 10)
    a.normalize();

    expect(a.x).toSubequal(0.89442719099);
    expect(a.y).toSubequal(0.44721359549);
})

setTimeout(end, 500)
