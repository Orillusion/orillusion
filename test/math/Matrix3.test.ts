import { test, expect, end, delay } from '../util'
import { Matrix3 } from '@orillusion/core';

await test('Matrix3 clone', async () => {
    let a = new Matrix3();

    let b = a.clone();
    expect(a.a).toEqual(b.a);
    expect(a.b).toEqual(b.b);
    expect(a.c).toEqual(b.c);
    expect(a.d).toEqual(b.d);
    expect(a.tx).toEqual(b.tx);
    expect(a.ty).toEqual(b.ty);
})

await test('Matrix3 identity', async () => {
    let a = new Matrix3();
    a.identity();

    expect(a.a).toEqual(1);
    expect(a.b).toEqual(0);
    expect(a.c).toEqual(0);
    expect(a.d).toEqual(1);
    expect(a.tx).toEqual(0);
    expect(a.ty).toEqual(0);
})

await test('Matrix3 rotate', async () => {
    let a = new Matrix3();
    a.rotate(90);
    let result = a.transformPoint(10, 0);

    expect(result.x).toSubequal(0)
    expect(result.y).toSubequal(10);
})

await test('Matrix3 scale', async () => {
    let a = new Matrix3();
    a.scale(2, 1);
    let result = a.transformPoint(10, 0);

    expect(result.x).toSubequal(20);
    expect(result.y).toSubequal(0);
})

setTimeout(end, 500)
