import { test, end, expect } from '../util'
import { Engine3D, webGPUContext } from '@orillusion/core';

await test('Init', async () => {
    await Engine3D.init();
    let width = Math.floor(webGPUContext.canvas.clientWidth * webGPUContext.pixelRatio * webGPUContext.super)
    let height = Math.floor(webGPUContext.canvas.clientHeight * webGPUContext.pixelRatio * webGPUContext.super)
    let aspect = width / height;

    expect(Engine3D.aspect).toEqual(aspect)
})

setTimeout(end, 500)