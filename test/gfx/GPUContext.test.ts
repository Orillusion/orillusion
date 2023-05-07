import { test, expect, end, delay } from '../util'
import { webGPUContext } from '@orillusion/core';

await test('GPUContext createIndexBuffer', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);
})

setTimeout(end, 500)
