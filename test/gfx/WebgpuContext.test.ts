import { test, expect, end, delay } from '../util'
import { Engine3D, webGPUContext } from '@orillusion/core';

await test('webgpu context', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);
})

await test('webgpu context adapter', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);
    expect(webGPUContext.adapter != null).toEqual(true);
    expect(webGPUContext.device != null).toEqual(true);
})


await test('webgpu context pixelRatio', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);
    expect(webGPUContext.pixelRatio >= 1).toEqual(true);
})

await test('webgpu canvas', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);
    expect(webGPUContext.canvas != null).toEqual(true);
})

await test('webgpu size', async () => {
    let suc = await webGPUContext.init();
    expect(suc).toEqual(true);
    expect(webGPUContext.presentationSize[0] > 32).toEqual(true);
    expect(webGPUContext.presentationSize[1] > 32).toEqual(true);
    expect(webGPUContext.presentationSize[0] == webGPUContext.windowWidth).toEqual(true);
    expect(webGPUContext.presentationSize[1] == webGPUContext.windowHeight).toEqual(true);
})


setTimeout(end, 500)
