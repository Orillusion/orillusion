import { test, expect, end, delay } from '../util'
import { Rect } from '@orillusion/core';

await test('Rect base', async () => {
    let rect = new Rect(10, 10, 20, 10);

    let rect2 = rect.clone();

    expect(rect.width).toEqual(20);
    expect(rect.height).toEqual(10);

    expect(rect2.width).toEqual(rect.w);
    expect(rect2.height).toEqual(rect.h);
})

await test('Rect pointInRect', async () => {
    let result = Rect.pointInRect(0, 0, -10, -10, 10, 10);

    expect(result).toEqual(true);
})

await test('Rect inner', async () => {
    let rect = new Rect(10, 10, 20, 10);

    expect(rect.inner(11, 19)).toEqual(true);
})

await test('Rect equal', async () => {
    let rect1 = new Rect(10, 10, 20, 10);
    let rect2 = new Rect(10, 10, 20, 10);
    let rect3 = new Rect(0, 0, 20, 10);

    expect(rect1.equal(rect2)).toEqual(true);
    expect(rect1.equal(rect3)).toEqual(false);
})

await test('Rect equalArea', async () => {
    let rect1 = new Rect(10, 10, 20, 10);

    expect(rect1.equalArea(10, 10, 20, 10)).toEqual(true);
})

await test('Rect equalInnerArea', async () => {
    let rect1 = new Rect(10, 10, 20, 10);
    let rect2 = new Rect(12, 12, 16, 6);

    expect(rect1.equalInnerArea(rect2)).toEqual(true);
})

await test('Rect innerArea', async () => {
    let rect1 = new Rect(10, 10, 20, 10);
    let rect2 = new Rect(12, 12, 20, 10);

    let result = rect1.innerArea(rect2, new Rect());

    expect(result.x).toEqual(12);
    expect(result.y).toEqual(12);
    expect(result.w).toEqual(18);
    expect(result.h).toEqual(8);
})

setTimeout(end, 500)
