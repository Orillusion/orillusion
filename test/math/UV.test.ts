import { test, expect, end, delay } from '../util'
import { UV } from '@orillusion/core';

await test('UV', async () => {
    let rect = new UV(0, 0);

    expect(rect.u).toEqual(0);
    expect(rect.v).toEqual(0);
})

setTimeout(end, 500)
