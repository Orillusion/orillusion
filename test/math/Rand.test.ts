import { test, expect, end, delay } from '../util'
import { Rand } from '@orillusion/core';

await test('Rand seed', async () => {
    let rand = new Rand(2023);
    expect(rand.seed).toEqual(2023);

    rand.seed = 10;
    expect(rand.seed).toEqual(10);

    let rand2 = rand.clone();
    expect(rand2.seed).toEqual(rand.seed);
})

await test('Rand get', async () => {
    let rand = new Rand(2023);

    expect(rand.get()).toRange(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
})

await test('Rand getFloat', async () => {
    let rand = new Rand(2023);

    expect(rand.getFloat()).toRange(0.0, 1.0);
})

await test('Rand getSignedFloat', async () => {
    let rand = new Rand(2023);

    expect(rand.getSignedFloat()).toRange(-1.0, 1.0);
})

setTimeout(end, 500)
