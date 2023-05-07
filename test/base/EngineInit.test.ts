import { test, end, expect } from '../util'
import { Engine3D } from '@orillusion/core';

await test('Init', async () => {
    await Engine3D.init();
    expect(Engine3D.aspect).toEqual(window.innerWidth/window.innerHeight)
})

setTimeout(end, 500)