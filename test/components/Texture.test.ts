import { test, expect, end } from '../util'
import { Camera3D, Color, Engine3D, Float16ArrayTexture, Float32ArrayTexture, Object3D, Scene3D, SolidColorSky } from '@orillusion/core';

await test('textue2D create Uint8Texture', async () => {
    await Engine3D.init();
    let texture2D = Engine3D.res.createTexture(32, 64, 255, 255, 0, 255, 'uint8Texture')
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})

await test('textue2D create Float16ArrayTexture', async () => {
    let texture2D = new Float16ArrayTexture();
    let color: number[] = [];
    let width = 64;
    let height = 64;
    for (let i = 0, count = width * height; i < count; i++) {
        color.push(1, 0.5, 0.0, 1);
    }
    texture2D.create(width, height, color, false);
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})

await test('textue2D create Float32ArrayTexture', async () => {
    let texture2D = new Float32ArrayTexture();
    let width = 64;
    let height = 64;
    let color: Float32Array = new Float32Array(width * height * 4);

    for (let i = 0, count = width * height; i < count; i++) {
        color[i * 4] = 1;
        color[i * 4 + 1] = 0;
        color[i * 4 + 2] = 0.5;
        color[i * 4 + 3] = 1;
    }
    texture2D.create(width, height, color, false);
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})

await test('textureCube create SolidColorSky', async () => {
    let color = new Color(1, 0, 1, 1);
    let texture2D = new SolidColorSky(color);
    let success = (texture2D.gpuSampler && texture2D.getGPUTexture() && texture2D.getGPUView()) ? true : false;
    expect(success).toEqual(true);
})


setTimeout(end, 500)
